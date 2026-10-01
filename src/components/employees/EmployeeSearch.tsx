"use client";

import { Input, Select } from "@/components/ui";

export interface EmployeeSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedSpecialization: string;
  onSpecializationChange: (spec: string) => void;
}

export function EmployeeSearch({
  searchTerm,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  selectedSpecialization,
  onSpecializationChange,
}: EmployeeSearchProps) {
  const roleOptions = [
    { label: "All Roles", value: "" },
    { label: "Admin", value: "admin" },
    { label: "Manager", value: "manager" },
    { label: "Technician", value: "technician" },
    { label: "Reception", value: "reception" },
    { label: "Purchase", value: "purchase" },
    { label: "Accountant", value: "accountant" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Active Only", value: "active" },
    { label: "Inactive Only", value: "inactive" },
  ];

  const specOptions = [
    { label: "All Specializations", value: "" },
    { label: "Laptop", value: "laptop" },
    { label: "Mobile", value: "mobile" },
    { label: "Apple Devices", value: "apple" },
    { label: "Hardware Repair", value: "hardware" },
    { label: "Software & OS", value: "software" },
    { label: "General", value: "general" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
      <div className="sm:col-span-1 md:col-span-1">
        <Input
          placeholder="Search Name, EMP ID, Phone..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          startIcon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      <Select
        options={roleOptions}
        value={selectedRole}
        onChange={(e) => onRoleChange(e.target.value)}
      />

      <Select
        options={statusOptions}
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
      />

      <Select
        options={specOptions}
        value={selectedSpecialization}
        onChange={(e) => onSpecializationChange(e.target.value)}
      />
    </div>
  );
}
