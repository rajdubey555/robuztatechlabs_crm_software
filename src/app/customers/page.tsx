"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Customer, getCustomers, CustomerSearch, CustomerTable } from "@/modules/customers";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";

export default function CustomersListPage() {
  const { selectedBranch, activeBranchInfo, isFiltered, clearFilters } = useBranchContext();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      // Get user info for Topbar/Sidebar
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }

      // Fetch customers via customerService
      const { data, error: fetchError } = await getCustomers();
      if (fetchError) {
        setError("Failed to load customers: " + fetchError);
      } else {
        setCustomers(data);
      }
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  // Search and Branch filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Branch context filter
      if (selectedBranch !== "all" && c.branch && c.branch !== "both" && c.branch !== selectedBranch) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();

      return (
        c.customer_code.toLowerCase().includes(query) ||
        c.full_name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.city && c.city.toLowerCase().includes(query))
      );
    });
  }, [customers, selectedBranch, searchQuery]);

  return (
    <AppShell userEmail={userEmail}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Customers
            </h1>
            {activeBranchInfo && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${activeBranchInfo.badgeColor}`}>
                📍 {activeBranchInfo.shortName}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage client records for South Bopal and Tragad repair labs
          </p>
        </div>

        <Link href="/customers/new">
          <Button variant="primary" size="md">
            <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <CustomerSearch
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" className="text-[#009688]" />
        </div>
      ) : filteredCustomers.length > 0 ? (
        <CustomerTable customers={filteredCustomers} />
      ) : searchQuery || isFiltered ? (
        <EmptyState
          title="No matching customers found"
          description="No customer records match your current search and branch filter."
          action={
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); clearFilters(); }}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No customers added yet"
          description="Get started by creating your first customer record."
          action={
            <Link href="/customers/new">
              <Button variant="primary" size="sm">
                + Add First Customer
              </Button>
            </Link>
          }
        />
      )}
    </AppShell>
  );
}
