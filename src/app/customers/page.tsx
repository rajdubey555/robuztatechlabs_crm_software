"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Customer, getCustomers, CustomerSearch, CustomerTable } from "@/modules/customers";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import {
  UserPlus,
  RefreshCw,
  Download,
} from "lucide-react";

export default function CustomersListPage() {
  const { selectedBranch, activeBranchInfo, isFiltered, clearFilters } = useBranchContext();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const supabase = createClient();

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }

      const { data, error: fetchError } = await getCustomers();
      if (fetchError) {
        setError("Failed to load customers: " + fetchError);
      } else {
        setCustomers(data);
      }
    } catch (err: unknown) {
      setError("An unexpected error occurred while loading customers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [supabase]);

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

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
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
      <div className="space-y-4">
        {/* Simple & Professional Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Customers
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {filteredCustomers.length}
              </span>
              {activeBranchInfo && (
                <span className="text-xs text-slate-400 font-medium">
                  • {activeBranchInfo.shortName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage client records, phone numbers, and profile details
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CustomerSearch
              searchTerm={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Search by name, phone, email..."
              className="w-52 sm:w-64"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="h-9 w-9 p-0 shrink-0"
              title="Refresh customer list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#009688]" : "text-slate-500"}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredCustomers.length === 0}
              className="h-9 px-3 text-xs shrink-0"
              title="Export list as CSV"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Export
            </Button>

            <Link href="/customers/new" className="shrink-0">
              <Button variant="primary" size="sm" className="h-9 px-3.5 text-xs font-medium">
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Add Customer
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Clean Customer Table Content */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 space-y-2">
            <LoadingSpinner size="md" className="text-[#009688]" />
            <p className="text-xs text-slate-400 font-medium">Loading customers...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <CustomerTable customers={filteredCustomers} />
        ) : searchQuery || isFiltered ? (
          <EmptyState
            title="No matching customers"
            description="No customer records match your current search query or selected branch filter."
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
            description="Get started by creating your first customer profile."
            action={
              <Link href="/customers/new">
                <Button variant="primary" size="sm">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Add First Customer
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
