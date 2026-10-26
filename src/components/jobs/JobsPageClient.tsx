"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { RepairJob, getJobs } from "@/modules/jobs";
import { Employee, getEmployees } from "@/modules/employees";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner } from "@/components/ui";
import { JobSearch } from "@/components/jobs/JobSearch";
import { JobTable } from "@/components/jobs/JobTable";
import { useBranchContext } from "@/context/BranchContext";
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RotateCcw,
} from "lucide-react";

export interface JobsPageClientProps {
  initialJobs?: RepairJob[];
  initialEmployees?: Employee[];
  userEmail?: string;
}

export function JobsPageClient({
  initialJobs = [],
  initialEmployees = [],
  userEmail,
}: JobsPageClientProps) {
  const { selectedBranch, selectedCategory, isFiltered, clearFilters } = useBranchContext();

  const [jobs, setJobs] = useState<RepairJob[]>(initialJobs);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [loading, setLoading] = useState(initialJobs.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [diagnosisFilter, setDiagnosisFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch active employees for dropdown filter
      const empRes = await getEmployees();
      if (empRes.data) {
        setEmployees(empRes.data);
      }

      // Fetch repair jobs with customer, device, assigned employee & diagnoses
      const jobsRes = await getJobs();
      if (jobsRes.error) {
        throw new Error(jobsRes.error);
      } else {
        setJobs(jobsRes.data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load repair jobs.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialJobs.length === 0) {
      loadData();
    }
  }, [initialJobs.length, loadData]);

  // Employee dropdown options for JobSearch
  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      label: `${e.full_name} (${e.employee_code})`,
      value: e.id,
    }));
  }, [employees]);

  // Search & Filter logic (Including Branch & Category context from Topbar)
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      // Branch Context Filter (from Topbar)
      if (selectedBranch !== "all" && j.branch && j.branch !== selectedBranch) return false;

      // Category Context Filter (from Topbar)
      if (selectedCategory !== "all" && j.category_type && j.category_type !== selectedCategory) return false;

      // 1. Status Filter
      if (statusFilter && j.status !== statusFilter) return false;

      // 2. Priority Filter
      if (priorityFilter && j.priority !== priorityFilter) return false;

      // 3. Assignment Status Filter (Assigned / Unassigned)
      if (assignmentFilter === "assigned" && !j.assigned_employee_id) return false;
      if (assignmentFilter === "unassigned" && j.assigned_employee_id) return false;

      // 4. Employee Filter
      if (employeeFilter && j.assigned_employee_id !== employeeFilter) return false;

      // 5. Diagnosis Status Filter (Diagnosed / Pending)
      const isDiagnosed = j.status === "diagnosed" || (j.diagnoses && j.diagnoses.length > 0);
      if (diagnosisFilter === "diagnosed" && !isDiagnosed) return false;
      if (diagnosisFilter === "pending" && isDiagnosed) return false;

      // 6. Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const jobCode = j.job_code?.toLowerCase() || "";
      const custName = j.customer?.full_name?.toLowerCase() || "";
      const custPhone = j.customer?.phone?.toLowerCase() || "";
      const devCode = j.device?.device_code?.toLowerCase() || "";
      const brand = j.device?.brand?.toLowerCase() || "";
      const model = j.device?.model?.toLowerCase() || "";
      const serial = j.device?.serial_number?.toLowerCase() || "";
      const imei = j.device?.imei?.toLowerCase() || "";
      const complaint = j.customer_complaint?.toLowerCase() || "";
      const techName = j.assigned_employee?.full_name?.toLowerCase() || "";
      const techCode = j.assigned_employee?.employee_code?.toLowerCase() || "";

      return (
        jobCode.includes(q) ||
        custName.includes(q) ||
        custPhone.includes(q) ||
        devCode.includes(q) ||
        brand.includes(q) ||
        model.includes(q) ||
        serial.includes(q) ||
        imei.includes(q) ||
        complaint.includes(q) ||
        techName.includes(q) ||
        techCode.includes(q)
      );
    });
  }, [jobs, selectedBranch, selectedCategory, searchQuery, statusFilter, priorityFilter, assignmentFilter, employeeFilter, diagnosisFilter]);

  // Operational metrics for the current branch view
  const branchJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (selectedBranch !== "all" && j.branch && j.branch !== selectedBranch) return false;
      if (selectedCategory !== "all" && j.category_type && j.category_type !== selectedCategory) return false;
      return true;
    });
  }, [jobs, selectedBranch, selectedCategory]);

  const activeJobsCount = useMemo(() => {
    return branchJobs.filter(
      (j) => !["delivered", "cancelled", "unrepairable"].includes(j.status?.toLowerCase() || "")
    ).length;
  }, [branchJobs]);

  const pendingDiagnosisCount = useMemo(() => {
    return branchJobs.filter((j) => ["received", "diagnosis_pending"].includes(j.status?.toLowerCase() || "")).length;
  }, [branchJobs]);

  const readyForRepairCount = useMemo(() => {
    return branchJobs.filter((j) => ["diagnosed", "in_progress", "waiting_parts"].includes(j.status?.toLowerCase() || "")).length;
  }, [branchJobs]);

  const unassignedCount = useMemo(() => {
    return branchJobs.filter((j) => !j.assigned_employee_id && !["delivered", "cancelled", "unrepairable"].includes(j.status?.toLowerCase() || "")).length;
  }, [branchJobs]);

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter || priorityFilter || assignmentFilter || employeeFilter || diagnosisFilter || isFiltered
  );

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssignmentFilter("");
    setEmployeeFilter("");
    setDiagnosisFilter("");
    clearFilters();
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-5 w-full">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-sans text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Repair Jobs
                </h1>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
                </span>
              </div>
            </div>
          </div>

          <Link href="/jobs/new">
            <Button variant="primary" size="md" className="font-medium shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Job Card
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Minimal High-Density Operational Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Active Jobs
              </span>
              <span className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-white mt-0.5 block">
                {activeJobsCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Pending Assessment
              </span>
              <span className="text-xl font-bold font-sans tracking-tight text-amber-600 dark:text-amber-400 mt-0.5 block">
                {pendingDiagnosisCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Ready for Repair
              </span>
              <span className="text-xl font-bold font-sans tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {readyForRepairCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Unassigned Tech
              </span>
              <span className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-white mt-0.5 block">
                {unassignedCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <JobSearch
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          selectedPriority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          assignmentFilter={assignmentFilter}
          onAssignmentFilterChange={setAssignmentFilter}
          employeeFilter={employeeFilter}
          onEmployeeFilterChange={setEmployeeFilter}
          diagnosisFilter={diagnosisFilter}
          onDiagnosisFilterChange={setDiagnosisFilter}
          employeeOptions={employeeOptions}
          onResetFilters={resetFilters}
        />

        {/* Content Table or Empty States */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <LoadingSpinner size="lg" className="text-[#009688]" />
          </div>
        ) : filteredJobs.length > 0 ? (
          <JobTable jobs={filteredJobs} onJobDeleted={loadData} />
        ) : hasActiveFilters ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="font-sans text-base font-semibold text-slate-900 dark:text-white">
              No matching repair jobs found
            </h3>
            <p className="text-xs text-slate-500">
              No repair tickets match your search or filter criteria.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs font-medium">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#009688] flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="font-sans text-base font-semibold text-slate-900 dark:text-white">
              No repair jobs created yet
            </h3>
            <p className="text-xs text-slate-500">
              Create your first repair job card to start tracking diagnostics and service.
            </p>
            <Link href="/jobs/new">
              <Button variant="primary" size="sm" className="mt-2 text-xs font-medium">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create First Job Card
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
