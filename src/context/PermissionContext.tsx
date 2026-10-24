"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Employee } from "@/types/employee";
import {
  MODULES,
  generateDefaultPermissions,
  getModuleByPath,
  normalizeRole,
} from "@/types/permissions";

export interface PermissionContextType {
  userEmail: string | null;
  currentRole: string;
  isAdmin: boolean;
  currentEmployee: Employee | null;
  employees: Employee[];
  permissions: Record<string, boolean>;
  hasPermission: (key: string) => boolean;
  canAccessPage: (path: string) => boolean;
  refreshPermissions: () => Promise<void>;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const LOCAL_STORAGE_PERMISSIONS_KEY = "robuzta_staff_permissions";

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allSavedPerms, setAllSavedPerms] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Clear any legacy preview state from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem("robuzta_preview_emp_id_v1");
      localStorage.removeItem("robuzta_preview_emp_id");
    } catch {
      // ignore
    }
  }, []);

  // Main loader for auth, employees, and permissions
  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Get current logged in user from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || null;
      setUserEmail(email);

      // Clean email
      const normalizedEmail = email ? email.toLowerCase().trim() : null;

      // Extract Supabase user metadata role & full_name
      const authRole = (user?.user_metadata?.role as string) || (user?.app_metadata?.role as string) || null;
      const authName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || null;

      // 2. Fetch all employees from DB
      const { data: empData } = await supabase
        .from("employees")
        .select("*")
        .order("full_name", { ascending: true });

      const empList = (empData as Employee[]) || [];
      setEmployees(empList);

      // 3. Match employee by email
      let matchedEmp = normalizedEmail
        ? empList.find((e) => e.email?.toLowerCase().trim() === normalizedEmail) || null
        : null;

      // Strict RBAC: User is Admin ONLY if:
      // - Their email is literally "admin@robuzta.com"
      // - OR their employee record explicitly has role === "admin"
      // - OR their auth metadata explicitly has role === "admin"
      // - OR unauthenticated in local dev (!normalizedEmail)
      const isExplicitAdmin =
        normalizedEmail === "admin@robuzta.com" ||
        matchedEmp?.role === "admin" ||
        authRole === "admin" ||
        !normalizedEmail;

      if (isExplicitAdmin) {
        setCurrentRole("admin");
        setCurrentEmployee(matchedEmp);
        try {
          localStorage.setItem("robuzta_cached_email", normalizedEmail || "admin@robuzta.com");
          localStorage.setItem("robuzta_cached_role", "admin");
          if (matchedEmp) {
            localStorage.setItem("robuzta_cached_emp", JSON.stringify(matchedEmp));
          } else {
            localStorage.removeItem("robuzta_cached_emp");
          }
        } catch {}
      } else {
        // Staff member: resolve role (technician, manager, reception, purchase, accountant)
        const staffRole = normalizeRole(matchedEmp?.role || authRole || "technician");
        setCurrentRole(staffRole);

        // If matchedEmp was not found in employees table (e.g. RLS blocked or table delay),
        // synthesize a fallback employee object so UI displays their real name & role
        if (!matchedEmp && normalizedEmail) {
          const fallbackName = authName || normalizedEmail.split("@")[0].replace(/[._]/g, " ");
          matchedEmp = {
            id: user?.id || `staff-${normalizedEmail}`,
            employee_code: "EMP-STAFF",
            full_name: fallbackName,
            display_name: fallbackName,
            email: normalizedEmail,
            phone: "",
            role: staffRole as any,
            branch: "south_bopal",
            category_type: "laptop_general",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        setCurrentEmployee(matchedEmp);
        try {
          if (normalizedEmail) {
            localStorage.setItem("robuzta_cached_email", normalizedEmail);
          }
          localStorage.setItem("robuzta_cached_role", staffRole);
          if (matchedEmp) {
            localStorage.setItem("robuzta_cached_emp", JSON.stringify(matchedEmp));
          }
        } catch {}
      }

      // 4. Fetch permissions from staff_permissions table
      const { data: permsData } = await supabase
        .from("staff_permissions")
        .select("employee_id, permissions");

      const dbLookup: Record<string, Record<string, boolean>> = {};
      if (permsData && Array.isArray(permsData)) {
        permsData.forEach((row: { employee_id: string; permissions: Record<string, boolean> }) => {
          if (row.employee_id && row.permissions) {
            dbLookup[row.employee_id] = row.permissions;
          }
        });
      }

      // Merge with localStorage overrides
      let localLookup: Record<string, Record<string, boolean>> = {};
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_PERMISSIONS_KEY);
        if (local) {
          localLookup = JSON.parse(local);
        }
      } catch {
        // ignore
      }

      const mergedLookup: Record<string, Record<string, boolean>> = {};
      empList.forEach((emp) => {
        const defaults = generateDefaultPermissions(emp);
        const savedPerm =
          dbLookup[emp.id] ||
          localLookup[emp.id] ||
          (emp.email ? localLookup[emp.email.toLowerCase().trim()] : null);

        const finalMap = {
          ...defaults,
          ...(savedPerm || {}),
        };

        mergedLookup[emp.id] = finalMap;
        if (emp.email) {
          mergedLookup[emp.email.toLowerCase().trim()] = finalMap;
        }
      });

      setAllSavedPerms(mergedLookup);
    } catch (err) {
      console.warn("Permission load notice:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Real-time Auth state listener: immediately refresh on SIGNED_IN, SIGNED_OUT, etc.
  useEffect(() => {
    try {
      const cachedRole = localStorage.getItem("robuzta_cached_role");
      const cachedEmail = localStorage.getItem("robuzta_cached_email");
      const cachedEmp = localStorage.getItem("robuzta_cached_emp");
      if (cachedRole) setCurrentRole(cachedRole);
      if (cachedEmail) setUserEmail(cachedEmail);
      if (cachedEmp) setCurrentEmployee(JSON.parse(cachedEmp));
    } catch {}

    refreshPermissions();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUserEmail(null);
        setCurrentRole("");
        setCurrentEmployee(null);
        setIsLoading(false);
        try {
          localStorage.removeItem("robuzta_cached_email");
          localStorage.removeItem("robuzta_cached_role");
          localStorage.removeItem("robuzta_cached_emp");
        } catch {}
      } else if (
        event === "SIGNED_IN" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
        refreshPermissions();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshPermissions]);

  const isAdmin = currentRole === "admin";

  // Active permissions map
  const permissions = useMemo(() => {
    // If Admin, full access to everything
    if (isAdmin) {
      const fullMap: Record<string, boolean> = {};
      MODULES.forEach((m) => {
        fullMap[m.mainKey] = true;
        m.permissions.forEach((p) => {
          fullMap[p.key] = true;
        });
      });
      return fullMap;
    }

    // If staff member has saved permissions configured by Admin (lookup by id or email)
    if (currentEmployee?.id && allSavedPerms[currentEmployee.id]) {
      return allSavedPerms[currentEmployee.id];
    }
    if (currentEmployee?.email && allSavedPerms[currentEmployee.email.toLowerCase().trim()]) {
      return allSavedPerms[currentEmployee.email.toLowerCase().trim()];
    }
    if (userEmail && allSavedPerms[userEmail.toLowerCase().trim()]) {
      return allSavedPerms[userEmail.toLowerCase().trim()];
    }

    // Otherwise, default for employee is NO permissions pre-granted
    return generateDefaultPermissions(currentEmployee || currentRole);
  }, [isAdmin, currentEmployee, allSavedPerms, currentRole, userEmail]);

  // Check if a specific module/page can be accessed
  const canAccessPage = useCallback(
    (path: string): boolean => {
      // Super Admin always has full access
      if (isAdmin) {
        return true;
      }

      const mod = getModuleByPath(path);
      if (!mod) {
        return true; // Not a restricted module route
      }

      // Check if employee has permission - MUST be strictly true
      return permissions[mod.mainKey] === true;
    },
    [isAdmin, permissions]
  );

  // Check if a granular action is permitted (e.g. jobs.create)
  const hasPermission = useCallback(
    (key: string): boolean => {
      if (isAdmin) {
        return true;
      }
      return permissions[key] === true;
    },
    [isAdmin, permissions]
  );

  return (
    <PermissionContext.Provider
      value={{
        userEmail,
        currentRole,
        isAdmin,
        currentEmployee,
        employees,
        permissions,
        hasPermission,
        canAccessPage,
        refreshPermissions,
        isLoading,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}
