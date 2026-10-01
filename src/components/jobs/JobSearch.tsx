"use client";

import { Input, Select } from "@/components/ui";

export interface JobSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  assignmentFilter: string;
  onAssignmentFilterChange: (filter: string) => void;
  employeeFilter: string;
  onEmployeeFilterChange: (empId: string) => void;
  diagnosisFilter: string;
  onDiagnosisFilterChange: (diag: string) => void;
  employeeOptions?: { label: string; value: string }[];
}

export function JobSearch({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  assignmentFilter,
  onAssignmentFilterChange,
  employeeFilter,
  onEmployeeFilterChange,
  diagnosisFilter,
  onDiagnosisFilterChange,
  employeeOptions = [],
}: JobSearchProps) {
  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Received", value: "received" },
    { label: "Diagnosis Pending", value: "diagnosis_pending" },
    { label: "Diagnosed", value: "diagnosed" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Unrepairable", value: "unrepairable" },
  ];

  const priorityOptions = [
    { label: "All Priorities", value: "" },
    { label: "Critical", value: "critical" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ];

  const assignmentOptions = [
    { label: "All Assignments", value: "" },
    { label: "Assigned Only", value: "assigned" },
    { label: "Unassigned Only", value: "unassigned" },
  ];

  const diagnosisOptions = [
    { label: "All Diagnosis", value: "" },
    { label: "Diagnosed", value: "diagnosed" },
    { label: "Pending Diag", value: "pending" },
  ];

  const empSelectOptions = [
    { label: "All Technicians", value: "" },
    ...employeeOptions,
  ];

  return (
    <div className="space-y-3 w-full bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Top Search Input */}
      <div>
        <Input
          placeholder="Search Job ID, Technician Name, Customer Name, Phone, Brand, Model, S/N..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          startIcon={
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          endIcon={
            searchTerm ? (
              <button
                onClick={() => onSearchChange("")}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Categorized Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
        <Select
          options={diagnosisOptions}
          value={diagnosisFilter}
          onChange={(e) => onDiagnosisFilterChange(e.target.value)}
        />

        <Select
          options={assignmentOptions}
          value={assignmentFilter}
          onChange={(e) => onAssignmentFilterChange(e.target.value)}
        />

        <Select
          options={empSelectOptions}
          value={employeeFilter}
          onChange={(e) => onEmployeeFilterChange(e.target.value)}
        />

        <Select
          options={statusOptions}
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
        />

        <Select
          options={priorityOptions}
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
        />
      </div>
    </div>
  );
}
