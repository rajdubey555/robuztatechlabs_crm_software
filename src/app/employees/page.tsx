"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Employee, getEmployeesWithWorkload, EmployeeSearch, EmployeeTable } from "@/modules/employees";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import { Users, UserCheck, Wrench, Shield, Plus, Key } from "lucide-react";

export default function EmployeesListPage() {
  const { selectedBranch, selectedCategory, activeBranchInfo, activeCategoryInfo, isFiltered, clearFilters } = useBranchContext();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
        }

        // Fetch employees with workload via employeeService
        const { data, error: empError } = await getEmployeesWithWorkload();

        if (empError) throw new Error(empError);

        setEmployees(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load employees.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Client-side multi-field filtering (including Branch context)
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Branch context filter
      if (selectedBranch !== "all" && emp.branch && emp.branch !== "both" && emp.branch !== selectedBranch) {
        return false;
      }

      // Search term filter (Name, EMP Code, Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = emp.full_name.toLowerCase().includes(q);
        const matchesCode = emp.employee_code.toLowerCase().includes(q);
        const matchesPhone = emp.phone ? emp.phone.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCode && !matchesPhone) return false;
      }

      // Role filter
      if (selectedRole && emp.role !== selectedRole) {
        return false;
      }

      // Status filter
      if (selectedStatus === "active" && !emp.is_active) return false;
      if (selectedStatus === "inactive" && emp.is_active) return false;

      // Specialization filter
      if (selectedSpecialization && emp.specialization !== selectedSpecialization) {
        return false;
      }

      return true;
    });
  }, [employees, selectedBranch, searchQuery, selectedRole, selectedStatus, selectedSpecialization]);

  // Metrics
  const totalCount = employees.length;
  const activeTechs = employees.filter((e) => e.role === "technician" && e.is_active).length;
  const totalWorkload = employees.reduce((acc, e) => acc + (e.active_job_count || 0), 0);
  const activeStaff = employees.filter((e) => e.is_active).length;

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedRole || selectedStatus || selectedSpecialization || isFiltered
  );

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedRole("");
    setSelectedStatus("");
    setSelectedSpecialization("");
    clearFilters();
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-5 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Staff & Employee Directory
                </h1>
                {activeBranchInfo && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {activeBranchInfo.shortName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Staff profiles, role specializations, active workbench workloads, and access controls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/permissions">
              <Button variant="outline" size="sm" className="h-8.5 text-xs font-semibold">
                <Key className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Staff Permissions
              </Button>
            </Link>

            <Link href="/employees/new">
              <Button variant="primary" size="sm" className="h-8.5 text-xs font-semibold">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Employee
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Staff
              </span>
              <span className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-white mt-0.5 block font-mono">
                {totalCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Active Techs
              </span>
              <span className="text-xl font-bold font-sans tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
                {activeTechs}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Active Workload
              </span>
              <span className="text-xl font-bold font-sans tracking-tight text-amber-600 dark:text-amber-400 mt-0.5 block font-mono">
                {totalWorkload} jobs
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Active Status
              </span>
              <span className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-white mt-0.5 block font-mono">
                {activeStaff} / {totalCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[#009688]" />
            </div>
          </div>
        </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <EmployeeSearch
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedSpecialization={selectedSpecialization}
        onSpecializationChange={setSelectedSpecialization}
      />

      {/* Content Section */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" className="text-[#009688]" />
        </div>
      ) : filteredEmployees.length > 0 ? (
        <EmployeeTable employees={filteredEmployees} />
      ) : hasActiveFilters ? (
        <EmptyState
          title="No matching employees found"
          description="No employee records match your search query, role, or branch filter."
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No employees added yet"
          description="Get started by adding your first employee to the CRM system."
          action={
            <Link href="/employees/new">
              <Button variant="primary" size="sm">
                + Add First Employee
              </Button>
            </Link>
          }
        />
      )}
      </div>
    </AppShell>
  );
}
