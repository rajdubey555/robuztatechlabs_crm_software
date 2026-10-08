import Link from "next/link";
import { RepairJob } from "@/types/job";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from "@/components/ui";
import { JobStatusBadge } from "./JobStatusBadge";
import { JobPriorityBadge } from "./JobPriorityBadge";
import { BRANCHES, CATEGORIES } from "@/types/branch";

export interface JobTableProps {
  jobs: RepairJob[];
}

export function JobTable({ jobs }: JobTableProps) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Branch & Category</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Complaint</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const branchInfo = job.branch ? BRANCHES[job.branch] : BRANCHES["south_bopal"];
              const catInfo = job.category_type ? CATEGORIES[job.category_type] : CATEGORIES["laptop_general"];

              return (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    <Badge variant="primary">{job.job_code}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-max ${branchInfo.badgeColor}`}>
                        📍 {branchInfo.shortName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-max ${catInfo.badgeColor}`}>
                        {catInfo.icon} {catInfo.shortName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.customer ? (
                      <div>
                        <Link
                          href={`/customers/${job.customer.id}`}
                          className="font-medium text-slate-900 hover:text-[#009688] dark:text-white dark:hover:text-[#009688]"
                        >
                          {job.customer.full_name}
                        </Link>
                        <span className="block text-xs text-slate-400">
                          {job.customer.phone}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.device ? (
                      <div>
                        <Link
                          href={`/devices/${job.device.id}`}
                          className="font-medium text-slate-900 hover:text-[#009688] dark:text-white dark:hover:text-[#009688]"
                        >
                          {job.device.brand} {job.device.model}
                        </Link>
                        <span className="block text-xs font-mono text-slate-400">
                          {job.device.device_code}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.assigned_employee ? (
                      <Link
                        href={`/employees/${job.assigned_employee.id}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-[#009688] text-xs block"
                      >
                        {job.assigned_employee.full_name}
                      </Link>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">
                        Unassigned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs text-slate-700 dark:text-slate-300 line-clamp-2" title={job.customer_complaint}>
                    {job.customer_complaint}
                  </TableCell>
                  <TableCell>
                    <JobPriorityBadge priority={job.priority} />
                  </TableCell>
                  <TableCell>
                    <JobStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden space-y-3">
        {jobs.map((job) => {
          const branchInfo = job.branch ? BRANCHES[job.branch] : BRANCHES["south_bopal"];
          const catInfo = job.category_type ? CATEGORIES[job.category_type] : CATEGORIES["laptop_general"];

          return (
            <div
              key={job.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-1">
                <Badge variant="primary">{job.job_code}</Badge>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${branchInfo.badgeColor}`}>
                    📍 {branchInfo.shortName}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.badgeColor}`}>
                    {catInfo.icon} {catInfo.shortName}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {job.customer_complaint}
                </p>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  {job.customer && (
                    <p>
                      Customer:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {job.customer.full_name} ({job.customer.phone})
                      </span>
                    </p>
                  )}
                  {job.device && (
                    <p>
                      Device:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {job.device.brand} {job.device.model} ({job.device.device_code})
                      </span>
                    </p>
                  )}
                  <p>
                    Assigned Tech:{" "}
                    {job.assigned_employee ? (
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {job.assigned_employee.full_name}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">Unassigned</span>
                    )}
                  </p>
                  <p>Received: {formatDate(job.received_at)}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link href={`/jobs/${job.id}`} className="w-full">
                  <Button variant="outline" size="sm" fullWidth>
                    View Job Details
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
