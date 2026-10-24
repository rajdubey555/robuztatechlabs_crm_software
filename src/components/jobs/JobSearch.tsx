"use client";

import { Input, Select, Button } from "@/components/ui";
import { Search, X, RotateCcw } from "lucide-react";

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
  onResetFilters?: () => void;
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
  onResetFilters,
}: JobSearchProps) {
  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Received", value: "received" },
    { label: "In Diagnosis", value: "diagnosis_pending" },
    { label: "Diagnosed", value: "diagnosed" },
    { label: "Waiting for Parts", value: "waiting_parts" },
    { label: "Under Repair", value: "in_progress" },
    { label: "Ready for Pickup", value: "ready_for_delivery" },
    { label: "Delivered", value: "delivered" },
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

  const empSelectOptions = [
    { label: "All Technicians", value: "" },
    ...employeeOptions,
  ];

  const hasActiveFilters = Boolean(
    searchTerm || selectedStatus || selectedPriority || assignmentFilter || employeeFilter || diagnosisFilter
  );

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Input
            placeholder="Search Job ID, Customer, Phone, Device, S/N..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
            endIcon={
              searchTerm ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-wrap items-center">
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
        </div>

        {/* Clear Filter button if filters active */}
        {hasActiveFilters && onResetFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 px-3 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
