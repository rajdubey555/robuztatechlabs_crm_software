"use client";

import { useState, useEffect } from "react";
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
  const [localValue, setLocalValue] = useState(searchTerm);

  useEffect(() => {
    setLocalValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== searchTerm) {
        onSearchChange(localValue);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [localValue, searchTerm, onSearchChange]);

  const handleClear = () => {
    setLocalValue("");
    onSearchChange("");
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        startIcon={<Search className="h-4 w-4 text-slate-400" />}
        endIcon={
          localValue ? (
            <button
              type="button"
              onClick={handleClear}
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
