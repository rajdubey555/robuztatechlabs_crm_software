"use client";

import { Input, Select, Button } from "@/components/ui";
import { Search, X, RotateCcw } from "lucide-react";

export interface DeviceSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType?: string;
  onTypeChange?: (type: string) => void;
  onReset?: () => void;
}

export function DeviceSearch({
  searchTerm,
  onSearchChange,
  selectedType = "",
  onTypeChange,
  onReset,
}: DeviceSearchProps) {
  const typeOptions = [
    { label: "All Device Types", value: "" },
    { label: "Laptop", value: "Laptop" },
    { label: "MacBook", value: "MacBook" },
    { label: "Drone", value: "Drone" },
    { label: "Desktop", value: "Desktop" },
    { label: "iPhone", value: "iPhone" },
    { label: "Android Phone", value: "Android Phone" },
    { label: "Tablet", value: "Tablet" },
    { label: "Other", value: "Other" },
  ];

  const hasActiveFilters = Boolean(searchTerm || selectedType);

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search Device ID, Brand, Model, Serial, Customer..."
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

        {/* Device Type Select & Clear */}
        <div className="flex items-center gap-2.5">
          {onTypeChange && (
            <div className="w-48">
              <Select
                options={typeOptions}
                value={selectedType}
                onChange={(e) => onTypeChange(e.target.value)}
              />
            </div>
          )}

          {hasActiveFilters && onReset && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 px-3 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
