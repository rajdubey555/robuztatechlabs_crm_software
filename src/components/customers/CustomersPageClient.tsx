"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Customer, CustomerSearch, CustomerTable, getCustomers } from "@/modules/customers";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, EmptyState } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import { UserPlus, RefreshCw, Download } from "lucide-react";

export interface CustomersPageClientProps {
  initialCustomers?: Customer[];
  userEmail?: string;
}

export function CustomersPageClient({
  initialCustomers = [],
  userEmail,
}: CustomersPageClientProps) {
  const { selectedBranch, activeBranchInfo, isFiltered, clearFilters } = useBranchContext();

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getCustomers();
      if (fetchError) {
        setError("Failed to refresh customers: " + fetchError);
      } else {
        setCustomers(data);
      }
    } catch {
      setError("An unexpected error occurred while refreshing customers.");
    } finally {
      setRefreshing(false);
    }
  };

  // Filter automatically by global Topbar branch & search
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Global branch context filter from topbar
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

  // Export filtered customers as CSV
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return;

    const headers = ["Customer ID", "Full Name", "Phone", "Email", "City", "Branch", "Created Date"];
    const rows = filteredCustomers.map((c) => [
      `"${c.customer_code}"`,
      `"${c.full_name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.email || ""}"`,
      `"${c.city || ""}"`,
      `"${c.branch || "both"}"`,
      `"${c.created_at}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `robuzta_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Customers
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredCustomers.length} {filteredCustomers.length === 1 ? "customer" : "customers"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage client directory, devices and service history across branches
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={refreshing}
              disabled={refreshing}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredCustomers.length === 0}
              className="text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
              Export CSV
            </Button>

            <Link href="/customers/new">
              <Button variant="primary" size="sm" className="text-xs font-semibold shadow-xs">
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Add Customer
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search & Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CustomerSearch
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search by name, phone, email, ID or city..."
            className="w-full sm:w-80"
          />

          {isFiltered && activeBranchInfo && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">
                Filtered by: <strong className="text-slate-700 dark:text-slate-300">{activeBranchInfo.name}</strong>
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[#009688] hover:underline font-semibold"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Data Table View */}
        {filteredCustomers.length > 0 ? (
          <CustomerTable customers={filteredCustomers} />
        ) : searchQuery.trim() || isFiltered ? (
          <EmptyState
            title="No matching customers found"
            description="No clients match your search query or selected branch filter."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  clearFilters();
                }}
              >
                Clear Search
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No customers registered yet"
            description="Start by adding your first customer to track incoming devices and repair job cards."
            action={
              <Link href="/customers/new">
                <Button variant="primary" size="sm">
                  Add Customer
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
