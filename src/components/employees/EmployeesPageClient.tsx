"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Employee, getEmployeesWithWorkload, EmployeeSearch, EmployeeTable } from "@/modules/employees";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import { Users, UserCheck, Wrench, Shield, Plus, Key } from "lucide-react";

export interface EmployeesPageClientProps {
  initialEmployees?: Employee[];
  userEmail?: string;
}

export function EmployeesPageClient({
  initialEmployees = [],
  userEmail,
}: EmployeesPageClientProps) {
  const { selectedBranch, activeBranchInfo, isFiltered, clearFilters } = useBranchContext();

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [loading, setLoading] = useState(initialEmployees.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: empError } = await getEmployeesWithWorkload();
      if (empError) throw new Error(empError);
      setEmployees(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load employees.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialEmployees.length === 0) {
      loadData();
    }
  }, [initialEmployees.length]);

  // Client-side multi-field filtering (including Branch context)
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Branch context filter
      if (selectedBranch !== "all" && emp.branch && emp.branch !== "both" && emp.branch !== selectedBranch) {
        return false;
      }

      // Search term filter (Name, EMP Code, Phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = emp.full_name?.toLowerCase().includes(query);
        const codeMatch = emp.employee_code?.toLowerCase().includes(query);
        const phoneMatch = emp.phone?.toLowerCase().includes(query);
        const emailMatch = emp.email?.toLowerCase().includes(query);
        if (!nameMatch && !codeMatch && !phoneMatch && !emailMatch) {
          return false;
        }
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

  // Metrics for current branch view
  const branchEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (selectedBranch !== "all" && e.branch && e.branch !== "both" && e.branch !== selectedBranch) return false;
      return true;
    });
  }, [employees, selectedBranch]);

  const totalCount = branchEmployees.length;
  const activeCount = branchEmployees.filter((e) => e.is_active).length;
  const techCount = branchEmployees.filter((e) => e.role === "technician").length;
  const adminCount = branchEmployees.filter((e) => e.role === "admin" || e.role === "manager").length;

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Employees & Staff
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredEmployees.length} staff
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage workshop technicians, managers, receptionists and live workloads
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/permissions">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                <Key className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Staff Permissions
              </Button>
            </Link>

            <Link href="/employees/new">
              <Button variant="primary" size="sm" className="font-semibold text-xs shadow-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Employee
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Minimal High-Density Staff Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Staff</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {totalCount}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {activeCount}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Technicians</span>
              <Wrench className="w-4 h-4 text-[#009688]" />
            </div>
            <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">
              {techCount}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Admins & Managers</span>
              <Shield className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
              {adminCount}
            </div>
          </div>
        </div>

        {/* Search & Multi-Filter Bar */}
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

        {/* Content Table or Empty States */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" className="text-[#009688]" />
          </div>
        ) : filteredEmployees.length > 0 ? (
          <EmployeeTable employees={filteredEmployees} />
        ) : searchQuery.trim() || selectedRole || selectedStatus || selectedSpecialization || isFiltered ? (
          <EmptyState
            title="No matching staff found"
            description="No employees match your search query or selected filters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRole("");
                  setSelectedStatus("");
                  setSelectedSpecialization("");
                  clearFilters();
                }}
              >
                Clear All Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No employees registered yet"
            description="Start by adding your first employee to assign workshop repair jobs."
            action={
              <Link href="/employees/new">
                <Button variant="primary" size="sm">
                  Add Employee
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
