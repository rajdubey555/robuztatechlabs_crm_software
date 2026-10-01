"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, LoadingSpinner, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Employee } from "@/types/employee";

export interface PermissionsClientProps {
  userEmail?: string;
}

export interface PermissionItem {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export interface PermissionModule {
  id: string;
  pageName: string;
  sidebarHref: string;
  category: string;
  icon: string;
  mainKey: string;
  mainLabel: string;
  mainDescription: string;
  permissions: PermissionItem[];
}

const MODULES: PermissionModule[] = [
  {
    id: "dashboard",
    pageName: "Dashboard",
    sidebarHref: "/dashboard",
    category: "Dashboard & Overview",
    icon: "📊",
    mainKey: "dashboard.page_access",
    mainLabel: "Dashboard Page Access",
    mainDescription: "Allow staff member to open the main Dashboard page (/dashboard)",
    permissions: [
      { key: "dashboard.view_revenue", label: "View Revenue & Profit Statistics", description: "Access total earnings, monthly profit, and Job financial totals", defaultEnabled: true },
      { key: "dashboard.view_activities", label: "View Recent Activity Feed", description: "See realtime system logs and customer repair activity", defaultEnabled: true },
      { key: "dashboard.quick_actions", label: "Use Quick Action Buttons", description: "Access New Job, New Customer, and Quick Add buttons on dashboard", defaultEnabled: true },
    ],
  },
  {
    id: "customers",
    pageName: "Customers",
    sidebarHref: "/customers",
    category: "Customers & Contacts",
    icon: "👥",
    mainKey: "customers.page_access",
    mainLabel: "Customers Page Access",
    mainDescription: "Allow staff member to access Customers list (/customers)",
    permissions: [
      { key: "customers.create", label: "Create Customer Profile", description: "Register new customer profiles into the CRM", defaultEnabled: true },
      { key: "customers.edit", label: "Edit Customer Contact Info", description: "Update customer phone numbers, email, and address", defaultEnabled: true },
      { key: "customers.delete", label: "Delete Customer Profile", description: "Permanently delete customer profiles from database", defaultEnabled: false },
      { key: "customers.export", label: "Export Customer Directory", description: "Download customer database to Excel or CSV file", defaultEnabled: false },
    ],
  },
  {
    id: "devices",
    pageName: "Devices",
    sidebarHref: "/devices",
    category: "Devices Directory",
    icon: "📱",
    mainKey: "devices.page_access",
    mainLabel: "Devices Page Access",
    mainDescription: "Allow staff member to access Customer Devices (/devices)",
    permissions: [
      { key: "devices.create", label: "Register New Device", description: "Add customer devices with brand, model, IMEI/Serial", defaultEnabled: true },
      { key: "devices.edit", label: "Edit Device Details", description: "Modify device specs, passcode, and physical condition", defaultEnabled: true },
      { key: "devices.delete", label: "Delete Device Entry", description: "Remove device records from the CRM", defaultEnabled: false },
    ],
  },
  {
    id: "device_catalog",
    pageName: "Device Catalog",
    sidebarHref: "/device-catalog",
    category: "Master Device Catalog (Types, Brands & Models)",
    icon: "📚",
    mainKey: "device_catalog.page_access",
    mainLabel: "Device Catalog Page Access",
    mainDescription: "Allow staff member to access Master Device Catalog (/device-catalog)",
    permissions: [
      { key: "device_catalog.add_type", label: "Add Device Categories/Types", description: "Add new device categories (e.g., Smartwatch, Tablet, Laptop)", defaultEnabled: false },
      { key: "device_catalog.add_brand", label: "Add New Brands", description: "Add new brands under categories (e.g., Apple, Samsung, OnePlus)", defaultEnabled: false },
      { key: "device_catalog.add_model", label: "Add New Models", description: "Add new model names under brands (e.g., iPhone 16 Pro Max)", defaultEnabled: true },
      { key: "device_catalog.delete", label: "Delete Catalog Entries", description: "Remove categories, brands, or models from dropdown defaults", defaultEnabled: false },
    ],
  },
  {
    id: "jobs",
    pageName: "Jobs",
    sidebarHref: "/jobs",
    category: "Repair Jobs & Work Tickets",
    icon: "📋",
    mainKey: "jobs.page_access",
    mainLabel: "Repair Jobs Page Access",
    mainDescription: "Allow staff member to access Repair Jobs list (/jobs)",
    permissions: [
      { key: "jobs.create", label: "Create Job Card Tickets", description: "Intake new repair jobs and generate Job IDs", defaultEnabled: true },
      { key: "jobs.edit", label: "Edit Job Complaints & Estimate", description: "Modify customer complaint notes, priority, and diagnostic fees", defaultEnabled: true },
      { key: "jobs.assign", label: "Assign/Reassign Technician", description: "Assign job cards to specific workshop technicians", defaultEnabled: true },
      { key: "jobs.update_status", label: "Update Repair Status", description: "Change status to Diagnosis, In Progress, Ready, or Delivered", defaultEnabled: true },
      { key: "jobs.delete", label: "Delete Repair Ticket", description: "Permanently delete repair job cards from database", defaultEnabled: false },
    ],
  },
  {
    id: "part_requests",
    pageName: "Part Requests",
    sidebarHref: "/part-requests",
    category: "Spare Part Procurement Requests",
    icon: "🔩",
    mainKey: "part_requests.page_access",
    mainLabel: "Part Requests Page Access",
    mainDescription: "Allow staff member to access Part Requests (/part-requests)",
    permissions: [
      { key: "part_requests.create", label: "Create Part Request", description: "Generate new spare part requests for repair jobs", defaultEnabled: true },
      { key: "part_requests.update_status", label: "Change Request Status", description: "Update status to Pending, Ordered, Received, or Cancelled", defaultEnabled: true },
      { key: "part_requests.bulk_actions", label: "Perform Bulk Actions", description: "Use Select All and bulk status update buttons", defaultEnabled: true },
      { key: "part_requests.whatsapp_po", label: "Send WhatsApp Purchase Order", description: "Send single or bulk WhatsApp PO messages to vendors", defaultEnabled: true },
      { key: "part_requests.add_vendor", label: "Add New Vendor", description: "Register new vendors directly from part request page", defaultEnabled: false },
    ],
  },
  {
    id: "vendors",
    pageName: "Vendors",
    sidebarHref: "/vendors",
    category: "Vendor Directory & Suppliers",
    icon: "🏬",
    mainKey: "vendors.page_access",
    mainLabel: "Vendors Page Access",
    mainDescription: "Allow staff member to access Vendors page (/vendors)",
    permissions: [
      { key: "vendors.create", label: "Add New Vendor", description: "Create vendor profiles, phone numbers, and WhatsApp contacts", defaultEnabled: true },
      { key: "vendors.edit", label: "Edit Vendor Info", description: "Update vendor business details, address, and ratings", defaultEnabled: true },
      { key: "vendors.delete", label: "Delete Vendor Profile", description: "Remove vendor profiles from the CRM", defaultEnabled: false },
    ],
  },
  {
    id: "employees",
    pageName: "Employees",
    sidebarHref: "/employees",
    category: "Employees & Staff Directory",
    icon: "🛡️",
    mainKey: "employees.page_access",
    mainLabel: "Employees Page Access",
    mainDescription: "Allow staff member to access Staff Directory (/employees)",
    permissions: [
      { key: "employees.view", label: "View Staff Directory", description: "See employee directory, job titles, and contact info", defaultEnabled: true },
      { key: "employees.create", label: "Create Staff Account", description: "Add new staff accounts, set roles, and bank details", defaultEnabled: false },
      { key: "employees.edit", label: "Edit Staff Details", description: "Modify staff salaries, phone numbers, and emergency contacts", defaultEnabled: false },
      { key: "employees.delete", label: "Deactivate/Delete Staff Account", description: "Remove staff accounts from active directory", defaultEnabled: false },
    ],
  },
  {
    id: "permissions",
    pageName: "Permissions",
    sidebarHref: "/permissions",
    category: "Roles & System Access Control",
    icon: "⚙️",
    mainKey: "permissions.page_access",
    mainLabel: "Permissions Page Access",
    mainDescription: "Allow staff member to access Permissions page (/permissions)",
    permissions: [
      { key: "permissions.manage_roles", label: "Configure & Save Staff Permissions", description: "Modify and save custom access toggles for other staff members", defaultEnabled: false },
      { key: "permissions.apply_presets", label: "Apply Role Presets", description: "Use Technician and Manager preset templates", defaultEnabled: false },
    ],
  },
];

export function PermissionsClient({ userEmail }: PermissionsClientProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string>("admin");

  // Stores employee-specific permission overrides map: Record<employeeId, Record<permKey, boolean>>
  const [empPerms, setEmpPerms] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch current user details
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: currentEmp } = await supabase
            .from("employees")
            .select("role")
            .eq("email", user.email)
            .single();

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

          // Initialize default employee permissions
          const initialMap: Record<string, Record<string, boolean>> = {};
          empList.forEach((emp) => {
            const isAdminRole = emp.role === "admin";
            const isManagerRole = emp.role === "manager";

            const permMap: Record<string, boolean> = {};
            MODULES.forEach((mod) => {
              // Set Main Page Access
              if (isAdminRole) {
                permMap[mod.mainKey] = true;
              } else if (isManagerRole) {
                permMap[mod.mainKey] = mod.id !== "permissions";
              } else {
                permMap[mod.mainKey] = mod.id !== "employees" && mod.id !== "permissions";
              }

              // Set Sub-permissions
              mod.permissions.forEach((p) => {
                if (isAdminRole) {
                  permMap[p.key] = true;
                } else if (isManagerRole) {
                  permMap[p.key] = p.key !== "permissions.manage_roles" && p.key !== "jobs.delete";
                } else {
                  permMap[p.key] = p.defaultEnabled;
                }
              });
            });
            initialMap[emp.id] = permMap;
          });

          setEmpPerms(initialMap);
        }
      } catch (err: unknown) {
        console.error("Failed to load permissions:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Selected Employee object
  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  // Filtered employee list for search
  const filteredEmployees = employees.filter((e) =>
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const applyPreset = (preset: "all" | "none" | "tech" | "manager") => {
    if (!selectedEmpId) return;

    const newPermMap: Record<string, boolean> = {};
    MODULES.forEach((mod) => {
      if (preset === "all") {
        newPermMap[mod.mainKey] = true;
        mod.permissions.forEach((p) => (newPermMap[p.key] = true));
      } else if (preset === "none") {
        newPermMap[mod.mainKey] = false;
        mod.permissions.forEach((p) => (newPermMap[p.key] = false));
      } else if (preset === "tech") {
        const hasAccess = ["dashboard", "customers", "devices", "device_catalog", "jobs", "part_requests", "vendors"].includes(mod.id);
        newPermMap[mod.mainKey] = hasAccess;
        mod.permissions.forEach((p) => {
          newPermMap[p.key] = hasAccess && p.defaultEnabled;
        });
      } else if (preset === "manager") {
        const hasAccess = mod.id !== "permissions";
        newPermMap[mod.mainKey] = hasAccess;
        mod.permissions.forEach((p) => {
          newPermMap[p.key] = hasAccess && p.key !== "permissions.manage_roles" && p.key !== "jobs.delete";
        });
      }
    });

    setEmpPerms((prev) => ({
      ...prev,
      [selectedEmpId]: newPermMap,
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    // Simulate save to DB
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setToastMessage(`Permissions updated for ${selectedEmployee.full_name} (${selectedEmployee.employee_code})!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isAdmin = userRole === "admin";

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-5 w-full">
        {/* HEADER BAR WITH TOP EMPLOYEE SELECTOR DROPDOWN */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>🛡️</span> Staff Page Access & Feature Permissions
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure sidebar page access and detailed sub-feature permissions for staff members.
              </p>
            </div>

            {/* TOP EMPLOYEE SELECTOR DROPDOWN */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1.5">
                <span>👤</span> Select Staff Member:
              </label>

              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full md:w-80 px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-[#009688] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]/30 cursor-pointer shadow-2xs"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_code}) — {emp.role.toUpperCase()}
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePermissions}
                isLoading={saving}
                className="font-bold text-xs shrink-0"
              >
                Save Permissions
              </Button>
            </div>
          </div>

          {/* ACTIVE EMPLOYEE BANNER & PRESET BUTTONS */}
          {selectedEmployee && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#009688] text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                  {selectedEmployee.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {selectedEmployee.full_name}
                    </h3>
                    <Badge variant="primary" className="font-mono text-xs">
                      {selectedEmployee.employee_code}
                    </Badge>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800 capitalize">
                      Role: {selectedEmployee.role}
                    </span>
                    {selectedEmployee.is_active ? (
                      <Badge variant="success" className="text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="error" className="text-[10px]">Inactive</Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Email: <strong className="text-slate-700 dark:text-slate-300">{selectedEmployee.email || "N/A"}</strong>
                    {selectedEmployee.specialization ? ` • ${selectedEmployee.specialization}` : ""}
                  </span>
                </div>
              </div>

              {/* PRESET TEMPLATES BUTTONS */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">Apply Presets:</span>
                <Button variant="outline" size="sm" onClick={() => applyPreset("tech")} className="text-xs font-semibold">
                  Tech Preset
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("manager")} className="text-xs font-semibold">
                  Manager Preset
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("all")} className="text-xs font-semibold text-teal-700 border-teal-200 hover:bg-teal-50">
                  Enable All
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("none")} className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50">
                  Disable All
                </Button>
              </div>
            </div>
          )}
        </div>

        {toastMessage && (
          <Alert variant="success" onClose={() => setToastMessage(null)}>
            {toastMessage}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <LoadingSpinner size="lg" className="text-[#009688]" />
          </div>
        ) : !isAdmin ? (
          /* ACCESS DENIED STATE FOR NON-ADMIN USERS */
          <Card className="shadow-xs border-l-4 border-l-rose-500 w-full">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
                🔒
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Access Restricted — Admin Only
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Only System Administrators have access to configure staff permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* FULL WIDTH PERMISSIONS MODULE CARDS LIST */
          <div className="space-y-4 w-full">
            {selectedEmployee ? (
              MODULES.map((mod) => {
                const isPageAccessEnabled = empPerms[selectedEmpId]?.[mod.mainKey] ?? true;

                return (
                  <Card key={mod.id} className="shadow-xs overflow-hidden border border-slate-200 dark:border-slate-800 w-full">
                    {/* MODULE HEADER WITH MAIN PAGE ACCESS TOGGLE */}
                    <CardHeader className={`p-4 border-b transition-colors ${
                      isPageAccessEnabled
                        ? "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800"
                        : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{mod.icon}</span>
                          <div>
                            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                              <span>{mod.category}</span>
                              <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-200">
                                {mod.sidebarHref}
                              </span>
                            </CardTitle>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {mod.mainDescription}
                            </p>
                          </div>
                        </div>

                        {/* MAIN PAGE ACCESS TOGGLE */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            isPageAccessEnabled
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}>
                            {isPageAccessEnabled ? "🔓 Page Access ON" : "🔒 Page Access OFF"}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleEmployeePermission(mod.mainKey)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isPageAccessEnabled ? "bg-[#009688]" : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                isPageAccessEnabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* SUB-PERMISSIONS LIST IN A HIGH-DENSITY GRID */}
                    <CardContent className={`p-4 transition-opacity ${
                      isPageAccessEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
                        Sub-Feature & Action Permissions:
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {mod.permissions.map((perm) => {
                          const isSubEnabled = empPerms[selectedEmpId]?.[perm.key] ?? false;
                          return (
                            <div
                              key={perm.key}
                              className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-3 hover:border-[#009688]/40 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-2xs"
                            >
                              <div className="space-y-0.5 flex-1 pr-2">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#009688] shrink-0" />
                                  {perm.label}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                  {perm.description}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={!isPageAccessEnabled}
                                onClick={() => toggleEmployeePermission(perm.key)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isSubEnabled && isPageAccessEnabled ? "bg-[#009688]" : "bg-slate-300 dark:bg-slate-700"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                    isSubEnabled && isPageAccessEnabled ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="shadow-xs w-full">
                <CardContent className="p-8 text-center text-slate-400 text-xs">
                  Please select an employee from the dropdown above to configure permissions.
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end pt-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleSavePermissions}
                isLoading={saving}
                className="min-w-[220px] font-bold text-sm"
              >
                Save Staff Permissions
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
