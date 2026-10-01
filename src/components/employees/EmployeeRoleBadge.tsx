import { EmployeeRole } from "@/types/employee";
import { Badge } from "@/components/ui";

export function EmployeeRoleBadge({ role }: { role: EmployeeRole }) {
  const roleConfig: Record<
    EmployeeRole,
    { label: string; variant: "primary" | "warning" | "info" | "error" | "default" }
  > = {
    admin: { label: "Admin", variant: "error" },
    manager: { label: "Manager", variant: "warning" },
    technician: { label: "Technician", variant: "primary" },
    reception: { label: "Receptionist", variant: "info" },
    purchase: { label: "Purchase", variant: "default" },
    accountant: { label: "Accountant", variant: "default" },
  };

  const config = roleConfig[role] || {
    label: role,
    variant: "default",
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
