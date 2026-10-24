"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, LoadingSpinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Employee } from "@/types/employee";
import {
  Shield,
  BarChart3,
  Users,
  Laptop,
  FileText,
  Package,
  Store,
  Settings,
  Lock,
  Unlock,
  Check,
  X,
  Sparkles,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  MODULES,
  PermissionModule,
  PermissionItem,
  generateDefaultPermissions,
  getRolePreset,
} from "@/types/permissions";
import { usePermissions } from "@/context/PermissionContext";

export interface PermissionsClientProps {
  userEmail?: string;
}

function ModuleIcon({ name }: { name: PermissionModule["iconName"] }) {
  const className = "w-4 h-4 text-[#009688]";
  switch (name) {
    case "BarChart3":
      return <BarChart3 className={className} />;
    case "Users":
      return <Users className={className} />;
    case "Laptop":
      return <Laptop className={className} />;
    case "FileText":
      return <FileText className={className} />;
    case "Package":
      return <Package className={className} />;
    case "Store":
      return <Store className={className} />;
    case "Shield":
      return <Shield className={className} />;
    case "Settings":
      return <Settings className={className} />;
    default:
      return <Shield className={className} />;
  }
}

export function PermissionsClient({ userEmail }: PermissionsClientProps) {
  const supabase = createClient();
  const { refreshPermissions } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string>("admin");

  // Stores employee-specific permission overrides map: Record<employeeId, Record<permKey, boolean>>
  const [empPerms, setEmpPerms] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorMessage(null);
      try {
        // Fetch current user details
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: currentEmp } = await supabase
            .from("employees")
            .select("role")
            .eq("email", user.email)
            .maybeSingle();

          if (currentEmp?.role) {
            setUserRole(currentEmp.role);
          }
        }

        // Fetch all employees
        const { data: empData, error: empErr } = await supabase
          .from("employees")
          .select("*")
          .order("full_name", { ascending: true });

        if (empErr) throw empErr;
        const empList = (empData as Employee[]) || [];
        setEmployees(empList);

        if (empList.length > 0) {
          setSelectedEmpId(empList[0].id);

          // Try to fetch saved permissions from staff_permissions table
          const { data: savedPermsData } = await supabase
            .from("staff_permissions")
            .select("employee_id, permissions");

          const savedPermsLookup: Record<string, Record<string, boolean>> = {};
          if (savedPermsData && Array.isArray(savedPermsData)) {
            savedPermsData.forEach((row: { employee_id: string; permissions: Record<string, boolean> }) => {
              if (row.employee_id && row.permissions) {
                savedPermsLookup[row.employee_id] = row.permissions;
              }
            });
          }

          // Also check localStorage for local offline sync
          const localStored = localStorage.getItem("robuzta_staff_permissions");
          const localLookup = localStored ? JSON.parse(localStored) : {};

          const initialMap: Record<string, Record<string, boolean>> = {};
          empList.forEach((emp) => {
            const defaults = generateDefaultPermissions(emp);
            initialMap[emp.id] = {
              ...defaults,
              ...(localLookup[emp.id] || {}),
              ...(savedPermsLookup[emp.id] || {}),
            };
          });

          setEmpPerms(initialMap);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load permissions.";
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter((e) =>
      e.full_name.toLowerCase().includes(q) ||
      e.employee_code.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const toggleEmployeePermission = (permKey: string) => {
    if (!selectedEmpId || userRole !== "admin") return;

    setEmpPerms((prev) => ({
      ...prev,
      [selectedEmpId]: {
        ...prev[selectedEmpId],
        [permKey]: !prev[selectedEmpId]?.[permKey],
      },
    }));
  };

  const toggleAllInModule = (mod: PermissionModule, targetState: boolean) => {
    if (!selectedEmpId || userRole !== "admin") return;

    setEmpPerms((prev) => {
      const current = { ...(prev[selectedEmpId] || {}) };
      current[mod.mainKey] = targetState;
      mod.permissions.forEach((p) => {
        current[p.key] = targetState;
      });
      return {
        ...prev,
        [selectedEmpId]: current,
      };
    });
  };

  const applyPreset = (preset: "all" | "none" | "technician" | "tech" | "manager" | "reception" | "purchase" | "accountant") => {
    if (!selectedEmpId) return;

    if (preset === "all") {
      const newPermMap: Record<string, boolean> = {};
      MODULES.forEach((mod) => {
        newPermMap[mod.mainKey] = true;
        mod.permissions.forEach((p) => (newPermMap[p.key] = true));
      });
      setEmpPerms((prev) => ({ ...prev, [selectedEmpId]: newPermMap }));
      return;
    }

    if (preset === "none") {
      const newPermMap: Record<string, boolean> = {};
      MODULES.forEach((mod) => {
        newPermMap[mod.mainKey] = false;
        mod.permissions.forEach((p) => (newPermMap[p.key] = false));
      });
      setEmpPerms((prev) => ({ ...prev, [selectedEmpId]: newPermMap }));
      return;
    }

    const roleName = preset === "tech" ? "technician" : preset;
    const newPermMap = getRolePreset(roleName);
    setEmpPerms((prev) => ({
      ...prev,
      [selectedEmpId]: newPermMap,
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee || !selectedEmpId) return;
    setSaving(true);
    setErrorMessage(null);

    const currentMap = empPerms[selectedEmpId] || {};

    try {
      // 1. Save to Supabase staff_permissions table
      const { error: saveErr } = await supabase
        .from("staff_permissions")
        .upsert(
          {
            employee_id: selectedEmpId,
            permissions: currentMap,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "employee_id" }
        );

      if (saveErr) {
        console.warn("Could not save to staff_permissions DB table:", saveErr.message);
      }

      // 2. Persist in localStorage for instant fast retrieval (indexed by id and email)
      try {
        const existing = localStorage.getItem("robuzta_staff_permissions");
        const parsed = existing ? JSON.parse(existing) : {};
        parsed[selectedEmpId] = currentMap;
        if (selectedEmployee.email) {
          parsed[selectedEmployee.email.toLowerCase().trim()] = currentMap;
        }
        localStorage.setItem("robuzta_staff_permissions", JSON.stringify(parsed));
      } catch (storageErr) {
        console.warn("Local storage write error:", storageErr);
      }

      // 3. Immediately refresh app-wide permissions context so sidebar and guards update
      await refreshPermissions();

      setToastMessage(`Permissions saved successfully for ${selectedEmployee.full_name} (${selectedEmployee.employee_code})`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save permissions.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = userRole === "admin";

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-5 w-full">
        {/* HEADER BAR */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Staff Access & Role Permissions
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure page-level navigation and granular feature access for every team member.
                </p>
              </div>
            </div>

            {/* TOP EMPLOYEE SELECTOR & ACTION BUTTONS */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative min-w-[240px] sm:min-w-[280px]">
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688] cursor-pointer shadow-2xs"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) • {emp.role.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePermissions}
                isLoading={saving}
                className="h-8.5 text-xs font-semibold shrink-0 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* ACTIVE EMPLOYEE SUMMARY & PRESET BUTTONS */}
          {selectedEmployee && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] font-bold text-sm flex items-center justify-center border border-teal-200 dark:border-teal-800 shrink-0">
                  {selectedEmployee.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedEmployee.full_name}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {selectedEmployee.employee_code}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 capitalize">
                      {selectedEmployee.role}
                    </span>
                    {selectedEmployee.is_active ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {selectedEmployee.email || "No email"} • {selectedEmployee.specialization ? `Spec: ${selectedEmployee.specialization}` : "General Repair"}
                  </span>
                </div>
              </div>

              {/* PRESET BUTTONS */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-slate-400 mr-1 hidden sm:inline">
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => applyPreset("technician")}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Technician
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("reception")}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Receptionist
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("manager")}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("purchase")}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Purchase
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("accountant")}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Accountant
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 hover:bg-teal-100/50 transition-colors"
                >
                  Admin (All)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("none")}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                >
                  Disable All
                </button>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <Alert variant="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {toastMessage && (
          <Alert variant="success" onClose={() => setToastMessage(null)}>
            {toastMessage}
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 space-y-3">
            <LoadingSpinner size="lg" className="text-[#009688]" />
            <p className="text-xs text-slate-400">Loading staff permissions...</p>
          </div>
        ) : !isAdmin ? (
          /* RESTRICTED ACCESS */
          <div className="rounded-xl border border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/10 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Admin Privilege Required
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Only System Administrators can customize and modify staff role permissions.
              </p>
            </div>
          </div>
        ) : (
          /* MODULE PERMISSION CARDS */
          <div className="space-y-4 w-full">
            {selectedEmployee ? (
              MODULES.map((mod) => {
                const isPageAccessEnabled = empPerms[selectedEmpId]?.[mod.mainKey] ?? true;
                const subPermsCount = mod.permissions.length;
                const activeSubCount = mod.permissions.filter(
                  (p) => empPerms[selectedEmpId]?.[p.key]
                ).length;

                return (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
                  >
                    {/* MODULE HEADER BAR */}
                    <div
                      className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isPageAccessEnabled
                          ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                          : "bg-slate-100/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                          <ModuleIcon name={mod.iconName} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {mod.category}
                            </span>
                            <span className="font-mono text-[10px] bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                              {mod.sidebarHref}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({activeSubCount}/{subPermsCount} enabled)
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {mod.mainDescription}
                          </p>
                        </div>
                      </div>

                      {/* MAIN PAGE ACCESS TOGGLE + MODULE QUICK ACTIONS */}
                      <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleAllInModule(mod, true)}
                            className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-teal-700 dark:hover:text-teal-300"
                            title="Enable all permissions in this module"
                          >
                            All On
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            type="button"
                            onClick={() => toggleAllInModule(mod, false)}
                            className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                            title="Disable all permissions in this module"
                          >
                            All Off
                          </button>
                        </div>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                              isPageAccessEnabled
                                ? "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {isPageAccessEnabled ? (
                              <>
                                <Unlock className="w-3 h-3 text-[#009688]" />
                                Page Access ON
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-slate-400" />
                                Page Access OFF
                              </>
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleEmployeePermission(mod.mainKey)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isPageAccessEnabled ? "bg-[#009688]" : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                isPageAccessEnabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SUB-PERMISSIONS GRID */}
                    <div
                      className={`p-4 transition-opacity ${
                        isPageAccessEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {mod.permissions.map((perm) => {
                          const isSubEnabled = empPerms[selectedEmpId]?.[perm.key] ?? false;
                          return (
                            <div
                              key={perm.key}
                              className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                                isSubEnabled && isPageAccessEnabled
                                  ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                  : "border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40"
                              }`}
                            >
                              <div className="space-y-0.5 flex-1 pr-2">
                                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      isSubEnabled && isPageAccessEnabled ? "bg-[#009688]" : "bg-slate-300 dark:bg-slate-600"
                                    }`}
                                  />
                                  {perm.label}
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                  {perm.description}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={!isPageAccessEnabled}
                                onClick={() => toggleEmployeePermission(perm.key)}
                                className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isSubEnabled && isPageAccessEnabled ? "bg-[#009688]" : "bg-slate-300 dark:bg-slate-700"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                    isSubEnabled && isPageAccessEnabled ? "translate-x-3.5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                Please select an employee above to configure permissions.
              </div>
            )}

            {/* BOTTOM SAVE BAR */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleSavePermissions}
                isLoading={saving}
                className="font-semibold text-xs px-6"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Staff Permissions
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
