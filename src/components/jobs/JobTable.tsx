"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { RepairJob } from "@/types/job";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Modal,
} from "@/components/ui";
import { usePermissions } from "@/context/PermissionContext";
import { deleteJob } from "@/modules/jobs";
import { JobStatusBadge } from "./JobStatusBadge";
import { JobPriorityBadge } from "./JobPriorityBadge";
import { BRANCHES } from "@/types/branch";
import {
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Plane,
  Eye,
  User,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export interface JobTableProps {
  jobs: RepairJob[];
  onJobDeleted?: () => void;
}

export function JobTable({ jobs, onJobDeleted }: JobTableProps) {
  const { isAdmin, hasPermission } = usePermissions();
  const canDeleteJob = isAdmin || hasPermission("jobs.delete");

  const [jobToDelete, setJobToDelete] = useState<RepairJob | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 20 records per page

  // Reset page when list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [jobs.length]);

  const totalPages = Math.ceil(jobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return jobs.slice(start, start + pageSize);
  }, [jobs, currentPage, pageSize]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteJob(jobToDelete.id);
      if (res.error) {
        setDeleteError(res.error);
        setDeleting(false);
      } else {
        setJobToDelete(null);
        setDeleting(false);
        if (onJobDeleted) onJobDeleted();
      }
    } catch {
      setDeleteError("An unexpected error occurred while deleting the job.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3 w-full">
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 pl-4 whitespace-nowrap">
                Job ID
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3">
                Customer
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3">
                Device & Branch
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3">
                Complaint / Issue
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                Technician
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                Priority
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                Received
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 text-right pr-4 whitespace-nowrap">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedJobs.map((job) => {
              const branchInfo = job.branch ? BRANCHES[job.branch] : null;
              const isDrone = job.category_type === "drone";
              const isCopied = copiedId === job.job_code;

              return (
                <TableRow
                  key={job.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                >
                  {/* Single-line Job ID with Click to Copy */}
                  <TableCell className="py-3 pl-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(job.job_code, e)}
                      title="Click to copy Job ID"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors text-xs font-mono font-semibold"
                    >
                      <span className="whitespace-nowrap">{job.job_code}</span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </button>
                  </TableCell>

                  {/* Customer (Name & Phone) */}
                  <TableCell className="py-3">
                    {job.customer ? (
                      <div>
                        <Link
                          href={`/customers/${job.customer.id}`}
                          className="font-semibold text-sm text-slate-900 hover:text-[#009688] dark:text-slate-100 dark:hover:text-[#009688] transition-colors block leading-tight"
                        >
                          {job.customer.full_name}
                        </Link>
                        <span className="block text-xs text-slate-400 mt-0.5 font-medium">
                          {job.customer.phone}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Device & Branch Integrated */}
                  <TableCell className="py-3">
                    {job.device ? (
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/devices/${job.device.id}`}
                            className="font-medium text-sm text-slate-900 hover:text-[#009688] dark:text-slate-100 dark:hover:text-[#009688] transition-colors"
                          >
                            {job.device.brand} {job.device.model}
                          </Link>
                          {isDrone && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/50 text-[#009688] border border-teal-200/70 dark:border-teal-800/70">
                              <Plane className="w-2.5 h-2.5" />
                              Drone
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span className="font-mono">{job.device.device_code}</span>
                          {branchInfo && (
                            <>
                              <span>•</span>
                              <span>{branchInfo.shortName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Complaint */}
                  <TableCell className="py-3 max-w-xs">
                    <p
                      className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 leading-relaxed"
                      title={job.customer_complaint}
                    >
                      {job.customer_complaint}
                    </p>
                  </TableCell>

                  {/* Technician */}
                  <TableCell className="py-3 whitespace-nowrap">
                    {job.assigned_employee ? (
                      <Link
                        href={`/employees/${job.assigned_employee.id}`}
                        className="font-medium text-xs text-slate-900 dark:text-slate-100 hover:text-[#009688] transition-colors"
                      >
                        {job.assigned_employee.full_name}
                      </Link>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Unassigned
                      </span>
                    )}
                  </TableCell>

                  {/* Priority */}
                  <TableCell className="py-3 whitespace-nowrap">
                    <JobPriorityBadge priority={job.priority} />
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3 whitespace-nowrap">
                    <JobStatusBadge status={job.status} />
                  </TableCell>

                  {/* Date */}
                  <TableCell className="py-3 whitespace-nowrap text-xs text-slate-500">
                    {formatDate(job.received_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 text-right pr-4 whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs font-medium">
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          View
                        </Button>
                      </Link>

                      {canDeleteJob && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setJobToDelete(job);
                          }}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                          title="Admin: Delete repair job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Clean Enterprise Pagination Footer (20 per page) */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            Showing <strong className="text-slate-900 dark:text-slate-100 font-semibold">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">
              {Math.min(currentPage * pageSize, jobs.length)}
            </strong>{" "}
            of <strong className="text-slate-900 dark:text-slate-100 font-semibold">{jobs.length}</strong> repair jobs
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 text-xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="px-2 font-medium text-xs text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 text-xs font-medium"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden space-y-3">
        {paginatedJobs.map((job) => {
          const branchInfo = job.branch ? BRANCHES[job.branch] : null;
          const isDrone = job.category_type === "drone";

          return (
            <div
              key={job.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {job.job_code}
                </span>

                <div className="flex items-center gap-1.5">
                  <JobPriorityBadge priority={job.priority} />
                  <JobStatusBadge status={job.status} />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                  {job.customer_complaint}
                </p>

                <div className="mt-2.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {job.customer && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {job.customer.full_name}
                      </span>
                      <span>{job.customer.phone}</span>
                    </div>
                  )}

                  {job.device && (
                    <div className="flex items-center justify-between">
                      <span>{job.device.brand} {job.device.model}</span>
                      <span className="font-mono">{job.device.device_code}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Tech: {job.assigned_employee?.full_name || "Unassigned"}</span>
                    <span>{formatDate(job.received_at)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 justify-end">
                <Link href={`/jobs/${job.id}`} className="flex-1">
                  <Button variant="outline" size="sm" fullWidth className="h-8 text-xs font-medium">
                    View Job Details
                  </Button>
                </Link>

                {canDeleteJob && (
                  <button
                    type="button"
                    onClick={() => setJobToDelete(job)}
                    className="h-8 px-2.5 inline-flex items-center justify-center rounded-md border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0"
                    title="Admin: Delete Job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Mobile Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal for Table */}
      {jobToDelete && canDeleteJob && (
        <Modal
          isOpen={Boolean(jobToDelete)}
          onClose={() => setJobToDelete(null)}
          title="Delete Repair Job Card"
          description={`Permanently delete job ticket #${jobToDelete.job_code}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJobToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Confirm Delete Job
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {deleteError && (
              <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                {deleteError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                    Admin Protected Action
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                    Permanent
                  </span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  Are you sure you want to delete job ticket <strong className="font-mono">{jobToDelete.job_code}</strong>? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{jobToDelete.customer?.full_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Device:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{jobToDelete.device?.brand} {jobToDelete.device?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-semibold capitalize text-[#009688]">{jobToDelete.status.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
