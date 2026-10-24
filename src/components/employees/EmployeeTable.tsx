import Link from "next/link";
import { Employee } from "@/types/employee";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from "@/components/ui";
import { EmployeeRoleBadge } from "./EmployeeRoleBadge";
import { BRANCHES } from "@/types/branch";
import { Eye, Pencil, Key } from "lucide-react";

export interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  return (
    <>
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 dark:bg-slate-800/50">
              <TableHead className="py-3 px-4 font-semibold text-xs">Staff ID</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-xs">Employee Name</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-xs">Role</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-xs">Branch & Spec</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-xs">Contact</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-xs">Status</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-xs text-center">Active Jobs</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {employees.map((emp) => (
              <TableRow key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <TableCell className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {emp.employee_code}
                </TableCell>
                <TableCell className="py-3 px-4">
                  <Link
                    href={`/employees/${emp.id}`}
                    className="font-semibold text-slate-900 dark:text-white hover:text-[#009688] transition-colors block"
                  >
                    {emp.full_name}
                  </Link>
                  {emp.display_name && emp.display_name !== emp.full_name && (
                    <span className="text-[11px] text-slate-400 block font-normal">
                      Display: {emp.display_name}
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4">
                  <EmployeeRoleBadge role={emp.role} />
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="space-y-0.5">
                    <span className="capitalize text-slate-700 dark:text-slate-300 font-medium block">
                      {emp.specialization || "General"}
                    </span>
                    {emp.branch && (
                      <span className="text-[11px] text-slate-400 block">
                        {emp.branch === "both" ? "Both Branches" : BRANCHES[emp.branch as "south_bopal" | "tragad"]?.shortName || emp.branch}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                  {emp.phone ? `+91 ${emp.phone}` : (emp.email || "—")}
                </TableCell>
                <TableCell className="py-3 px-4">
                  {emp.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold font-mono ${
                      (emp.active_job_count || 0) > 0
                        ? "bg-teal-50 text-[#009688] dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                        : "text-slate-400 bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    {emp.active_job_count || 0}
                  </span>
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/permissions`}>
                      <button
                        type="button"
                        className="p-1.5 rounded-md text-slate-400 hover:text-teal-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Configure Permissions"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                    <Link href={`/employees/${emp.id}`}>
                      <button
                        type="button"
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                    <Link href={`/employees/${emp.id}/edit`}>
                      <button
                        type="button"
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Employee"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
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
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                {emp.employee_code}
              </span>
              <div className="flex items-center gap-1.5">
                <EmployeeRoleBadge role={emp.role} />
                {emp.is_active ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">Inactive</span>
                )}
              </div>
            </div>

            <div>
              <Link href={`/employees/${emp.id}`} className="font-bold text-slate-900 dark:text-white text-sm hover:text-[#009688]">
                {emp.full_name}
              </Link>
              <p className="text-xs text-slate-500 mt-0.5">
                Specialization: <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{emp.specialization || "General"}</span>
              </p>
              {emp.phone && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">Phone: +91 {emp.phone}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Active Jobs: <strong className="font-bold text-[#009688] font-mono">{emp.active_job_count || 0}</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link href={`/employees/${emp.id}`} className="flex-1">
                <Button variant="outline" size="sm" fullWidth className="text-xs h-8">
                  View Profile
                </Button>
              </Link>
              <Link href={`/employees/${emp.id}/edit`} className="flex-1">
                <Button variant="ghost" size="sm" fullWidth className="text-xs h-8">
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
