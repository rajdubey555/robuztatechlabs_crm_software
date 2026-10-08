"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { RepairJob } from "@/types/job";
import { Employee } from "@/types/employee";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { JobSearch } from "@/components/jobs/JobSearch";
import { JobTable } from "@/components/jobs/JobTable";
import { useBranchContext } from "@/context/BranchContext";

export default function JobsListPage() {
  const { selectedBranch, selectedCategory, activeBranchInfo, activeCategoryInfo, isFiltered, clearFilters } = useBranchContext();

  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [diagnosisFilter, setDiagnosisFilter] = useState("");

  const [userEmail, setUserEmail] = useState<string | undefined>();

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserEmail(user.email);

        // Fetch active employees for dropdown filter
        const { data: empData } = await supabase
          .from("employees")
          .select("*")
          .order("full_name", { ascending: true });

        if (empData) {
          setEmployees(empData);
        }

        // Fetch repair jobs with customer, device, assigned employee & diagnoses
        const { data, error: fetchError } = await supabase
          .from("repair_jobs")
          .select(`
            *,
            customer:customers (
              id,
              customer_code,
              full_name,
              phone
            ),
            device:devices (
              id,
              device_code,
              device_type,
              brand,
              model,
              serial_number,
              imei
            ),
            assigned_employee:employees!repair_jobs_assigned_employee_id_fkey (
              id,
              employee_code,
              full_name,
              role,
              specialization,
              is_active
            ),
            diagnoses:diagnoses (
              id,
              diagnosis,
              estimated_cost,
              created_at
            )
          `)
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        } else {
          setJobs(data || []);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load repair jobs.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Employee dropdown options for JobSearch
  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      label: `${e.full_name} (${e.employee_code})`,
      value: e.id,
    }));
  }, [employees]);

  // Search & Filter logic (Including Branch & Category context)
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      // Branch Context Filter
      if (selectedBranch !== "all" && j.branch && j.branch !== selectedBranch) return false;

      // Category Context Filter
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Repair Jobs
            </h1>
            {activeBranchInfo && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${activeBranchInfo.badgeColor}`}>
                📍 {activeBranchInfo.shortName}
              </span>
            )}
            {activeCategoryInfo && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${activeCategoryInfo.badgeColor}`}>
                {activeCategoryInfo.icon} {activeCategoryInfo.name}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track job cards, diagnoses, technician assignments, complaints, and repair intake statuses
          </p>
        </div>

        <Link href="/jobs/new">
          <Button variant="primary" size="md">
            <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Job Card
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search & Filter */}
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
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" className="text-[#009688]" />
        </div>
      ) : filteredJobs.length > 0 ? (
        <JobTable jobs={filteredJobs} />
      ) : hasActiveFilters ? (
        <EmptyState
          title="No matching repair jobs found"
          description="No repair jobs match your current search, branch, or category filter criteria."
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No repair jobs created yet"
          description="Create your first repair job card to start tracking device repairs."
          action={
            <Link href="/jobs/new">
              <Button variant="primary" size="sm">
                + Create First Job Card
              </Button>
            </Link>
          }
        />
      )}
    </AppShell>
  );
}
