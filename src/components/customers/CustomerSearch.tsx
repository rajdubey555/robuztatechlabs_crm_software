"use client";

import { Input } from "@/components/ui";

export interface CustomerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function CustomerSearch({ searchTerm, onSearchChange }: CustomerSearchProps) {
  return (
    <div className="w-full max-w-md">
      <Input
        placeholder="Search by ID, Name, Phone, Email..."
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
  );
}
