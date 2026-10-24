import { Employee } from "./employee";

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
  iconName: "BarChart3" | "Users" | "Laptop" | "FileText" | "Package" | "Store" | "Shield" | "Settings" | "Receipt";
  mainKey: string;
  mainLabel: string;
  mainDescription: string;
  permissions: PermissionItem[];
}

export const MODULES: PermissionModule[] = [
  {
    id: "dashboard",
    pageName: "Dashboard",
    sidebarHref: "/dashboard",
    category: "Dashboard & Overview",
    iconName: "BarChart3",
    mainKey: "dashboard.page_access",
    mainLabel: "Dashboard Page Access",
    mainDescription: "Allow staff member to open the main Dashboard page (/dashboard)",
    permissions: [
      { key: "dashboard.view_revenue", label: "View Revenue & Profit Statistics", description: "Access total earnings, monthly profit, and Job financial totals", defaultEnabled: false },
      { key: "dashboard.view_activities", label: "View Recent Activity Feed", description: "See realtime system logs and customer repair activity", defaultEnabled: true },
      { key: "dashboard.quick_actions", label: "Use Quick Action Buttons", description: "Access New Job, New Customer, and Quick Add buttons on dashboard", defaultEnabled: true },
    ],
  },
  {
    id: "customers",
    pageName: "Customers",
    sidebarHref: "/customers",
    category: "Customers & Contacts",
    iconName: "Users",
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
    iconName: "Laptop",
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
    id: "jobs",
    pageName: "Jobs",
    sidebarHref: "/jobs",
    category: "Repair Jobs & Work Tickets",
    iconName: "FileText",
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
    category: "Spare Part Procurement",
    iconName: "Package",
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
    iconName: "Store",
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
    id: "expenses",
    pageName: "Expenses",
    sidebarHref: "/expenses",
    category: "Finance & Expense Tracker",
    iconName: "Receipt",
    mainKey: "expenses.page_access",
    mainLabel: "Expenses Page Access",
    mainDescription: "Allow staff member to access Company Expenses & P&L (/expenses)",
    permissions: [
      { key: "expenses.create", label: "Add New Expense", description: "Log company purchases, shop utility bills, and petty cash", defaultEnabled: true },
      { key: "expenses.edit", label: "Edit Expense Details", description: "Modify expense amount, category, or branch assignment", defaultEnabled: false },
      { key: "expenses.delete", label: "Delete Expense", description: "Permanently delete an expense record", defaultEnabled: false },
      { key: "expenses.export", label: "Export Expenses", description: "Download expense logs to CSV for CA & tax auditing", defaultEnabled: false },
    ],
  },
  {
    id: "employees",
    pageName: "Employees",
    sidebarHref: "/employees",
    category: "Employees & Staff Directory",
    iconName: "Shield",
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
    iconName: "Settings",
    mainKey: "permissions.page_access",
    mainLabel: "Permissions Page Access",
    mainDescription: "Allow staff member to access Permissions page (/permissions)",
    permissions: [
      { key: "permissions.manage_roles", label: "Configure & Save Staff Permissions", description: "Modify and save custom access toggles for other staff members", defaultEnabled: false },
      { key: "permissions.apply_presets", label: "Apply Role Presets", description: "Use Technician and Manager preset templates", defaultEnabled: false },
    ],
  },
];

export type NormalizedRole = "admin" | "technician" | "manager" | "reception" | "purchase" | "accountant";

export function normalizeRole(role?: string | null): NormalizedRole {
  if (!role) return "technician";
  const r = role.toLowerCase().trim();
  if (r === "admin" || r === "administrator" || r === "super_admin" || r === "super admin") return "admin";
  if (r === "manager") return "manager";
  if (r === "reception" || r === "receptionist") return "reception";
  if (r === "purchase" || r === "purchase_specialist" || r === "purchase specialist") return "purchase";
  if (r === "accountant" || r === "accounts") return "accountant";
  if (r === "technician" || r === "tech") return "technician";
  return "technician";
}

export const ROLE_LABELS: Record<NormalizedRole, string> = {
  admin: "Admin",
  manager: "Manager",
  technician: "Technician",
  reception: "Receptionist",
  purchase: "Purchase Specialist",
  accountant: "Accountant",
};

export function generateDefaultPermissions(empOrRole: Employee | { role?: string } | string): Record<string, boolean> {
  const roleStr = typeof empOrRole === "string" ? empOrRole : empOrRole?.role;
  const role = normalizeRole(roleStr);
  const permMap: Record<string, boolean> = {};

  const isAdmin = role === "admin";

  // Admin gets ALL permissions (Full Access)
  // Employees get NO permissions by default until Admin grants them
  MODULES.forEach((mod) => {
    permMap[mod.mainKey] = isAdmin;

    mod.permissions.forEach((p) => {
      permMap[p.key] = isAdmin;
    });
  });

  return permMap;
}

export function getRolePreset(roleStr: string): Record<string, boolean> {
  const role = normalizeRole(roleStr);
  const permMap: Record<string, boolean> = {};

  const allowedModules: Record<NormalizedRole, string[]> = {
    admin: ["dashboard", "customers", "devices", "jobs", "part_requests", "vendors", "expenses", "employees", "permissions"],
    manager: ["dashboard", "customers", "devices", "jobs", "part_requests", "vendors", "expenses", "employees"],
    technician: ["dashboard", "devices", "jobs", "part_requests"],
    reception: ["dashboard", "customers", "devices", "jobs"],
    purchase: ["dashboard", "jobs", "part_requests", "vendors", "expenses"],
    accountant: ["dashboard", "customers", "jobs", "part_requests", "vendors", "expenses"],
  };

  const currentAllowed = allowedModules[role] || allowedModules.technician;

  MODULES.forEach((mod) => {
    const hasModuleAccess = currentAllowed.includes(mod.id);
    permMap[mod.mainKey] = hasModuleAccess;

    mod.permissions.forEach((p) => {
      if (role === "admin") {
        permMap[p.key] = true;
      } else if (!hasModuleAccess) {
        permMap[p.key] = false;
      } else {
        if (role === "manager") {
          permMap[p.key] = p.key !== "jobs.delete" && p.key !== "customers.delete" && p.key !== "permissions.manage_roles";
        } else if (role === "technician" || role === "reception") {
          if (
            p.key.endsWith(".delete") ||
            p.key === "dashboard.view_revenue" ||
            p.key === "part_requests.whatsapp_po" ||
            p.key === "part_requests.add_vendor"
          ) {
            permMap[p.key] = false;
          } else {
            permMap[p.key] = p.defaultEnabled;
          }
        } else {
          permMap[p.key] = !p.key.endsWith(".delete") && p.defaultEnabled;
        }
      }
    });
  });

  return permMap;
}

export function getModuleByPath(path: string): PermissionModule | undefined {
  if (!path) return undefined;
  // Match path directly or prefix
  if (path === "/dashboard" || path === "/") return MODULES.find((m) => m.id === "dashboard");
  if (path.startsWith("/customers")) return MODULES.find((m) => m.id === "customers");
  if (path.startsWith("/devices") || path.startsWith("/device-catalog")) return MODULES.find((m) => m.id === "devices");
  if (path.startsWith("/jobs")) return MODULES.find((m) => m.id === "jobs");
  if (path.startsWith("/part-requests")) return MODULES.find((m) => m.id === "part_requests");
  if (path.startsWith("/vendors")) return MODULES.find((m) => m.id === "vendors");
  if (path.startsWith("/expenses")) return MODULES.find((m) => m.id === "expenses");
  if (path.startsWith("/employees")) return MODULES.find((m) => m.id === "employees");
  if (path.startsWith("/permissions")) return MODULES.find((m) => m.id === "permissions");
  return undefined;
}

