"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui";

export interface CustomerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomerSearch({
  searchTerm,
  onSearchChange,
  placeholder = "Search by Name, Phone, Email, ID or City...",
  className = "w-64 sm:w-72",
}: CustomerSearchProps) {
  return (
    <div className={`relative ${className}`}>
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        startIcon={<Search className="h-4 w-4 text-slate-400" />}
        endIcon={
          searchTerm ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
