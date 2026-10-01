import Link from "next/link";
import { Employee } from "@/types/employee";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from "@/components/ui";
import { EmployeeRoleBadge } from "./EmployeeRoleBadge";

export interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  return (
    <>
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active Jobs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-mono text-xs font-semibold">
                  <Badge variant="primary">{emp.employee_code}</Badge>
                </TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-white">
                  {emp.full_name}
                </TableCell>
                <TableCell>
                  <EmployeeRoleBadge role={emp.role} />
                </TableCell>
                <TableCell className="capitalize text-slate-600 dark:text-slate-300 text-xs">
                  {emp.specialization || "General"}
                </TableCell>
                <TableCell className="text-slate-500">
                  {emp.phone || "—"}
                </TableCell>
                <TableCell>
                  {emp.is_active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="default">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="font-semibold text-slate-700 dark:text-slate-300">
                  {emp.active_job_count || 0}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/employees/${emp.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    <Link href={`/employees/${emp.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden space-y-3">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Badge variant="primary">{emp.employee_code}</Badge>
              <div className="flex items-center gap-1.5">
                <EmployeeRoleBadge role={emp.role} />
                {emp.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Inactive</Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {emp.full_name}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Specialization: <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{emp.specialization || "General"}</span>
              </p>
              {emp.phone && (
                <p className="text-xs text-slate-500">Phone: {emp.phone}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Active Jobs: <span className="font-bold text-[#009688]">{emp.active_job_count || 0}</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link href={`/employees/${emp.id}`} className="flex-1">
                <Button variant="outline" size="sm" fullWidth>
                  View Profile
                </Button>
              </Link>
              <Link href={`/employees/${emp.id}/edit`} className="flex-1">
                <Button variant="ghost" size="sm" fullWidth>
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
