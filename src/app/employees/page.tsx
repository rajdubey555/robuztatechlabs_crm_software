"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Employee, getEmployeesWithWorkload, EmployeeSearch, EmployeeTable } from "@/modules/employees";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Employee Management
            </h1>
            {activeBranchInfo && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${activeBranchInfo.badgeColor}`}>
                📍 {activeBranchInfo.shortName}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage staff profiles, branch assignments, Drone/Laptop specializations, and job workloads
          </p>
        </div>

        <Link href="/employees/new">
          <Button variant="primary" size="md">
            <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </Button>
        </Link>
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
    </AppShell>
  );
}
