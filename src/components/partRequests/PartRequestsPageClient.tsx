"use client";

import React, { useState, useEffect } from "react";
// SVG Icon Helper Components
function IconShoppingBag({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconLayers({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0l-7 7m7-7l-7-7" />
    </svg>
  );
}

function IconClock({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconPackage({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function IconAlertTriangle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function IconPlus({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconSearch({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconFilter({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function IconRefresh({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
import { PartRequest, PartRequestStatus, PartRequestPriority } from "@/types/partRequest";
import { Vendor } from "@/types/vendor";
import { PartRequestList } from "./PartRequestList";
import { CreatePartRequestModal } from "./CreatePartRequestModal";
import { createClient } from "@/lib/supabase/client";

import { CreateVendorModal } from "@/components/vendors/CreateVendorModal";

import { AppShell } from "@/components/layout/AppShell";

interface PartRequestsPageClientProps {
  initialRequests?: PartRequest[];
  initialVendors?: Vendor[];
  userEmail?: string;
}

export function PartRequestsPageClient({
  initialRequests = [],
  initialVendors = [],
  userEmail,
}: PartRequestsPageClientProps) {
  const [requests, setRequests] = useState<PartRequest[]>(initialRequests);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorOpen] = useState(false);

  const supabase = createClient();

  // Fetch requests & vendors if missing or on refresh
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch ALL Vendors
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .order("name", { ascending: true });

      if (vendorData) {
        setVendors(vendorData as Vendor[]);
      }

      // Fetch Part Requests
      const { data: requestData, error: reqErr } = await supabase
        .from("part_requests")
        .select(`
          *,
          vendor:vendors(*)
        `)
        .order("created_at", { ascending: false });

      if (reqErr) {
        console.warn("Could not fetch part requests from Supabase:", reqErr.message || reqErr);
      } else if (requestData) {
        setRequests(requestData as PartRequest[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Error fetching part requests:", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.request_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.job_card_number && req.job_card_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.vendor?.name && req.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || req.priority === priorityFilter;
    const matchesVendor = vendorFilter === "ALL" || req.vendor_id === vendorFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesVendor;
  });

  // Calculate stats
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const orderedCount = requests.filter((r) => r.status === "ORDERED").length;
  const urgentCount = requests.filter((r) => r.priority === "URGENT" && r.status !== "RECEIVED" && r.status !== "CANCELLED").length;

  return (
    <AppShell userEmail={userEmail}>
      <div className="w-full mx-auto space-y-4 px-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <IconShoppingBag className="w-6 h-6 text-[#009688]" />
              Part Procurement Requests
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Request, track, and order spare parts directly from vendors via WhatsApp
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Refresh list"
            >
              <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin text-[#009688]" : ""}`} />
            </button>

            <button
              onClick={() => setIsAddVendorOpen(true)}
              className="px-3 py-2 border border-[#009688] text-[#009688] hover:bg-teal-50 dark:hover:bg-teal-950/30 font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all active:scale-95 text-xs"
            >
              <IconPlus className="w-3.5 h-3.5" />
              Add Vendor
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-[#009688] hover:bg-[#00796B] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 text-xs transition-all active:scale-95"
            >
              <IconPlus className="w-4 h-4" />
              New Part Request
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center shrink-0">
              <IconLayers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Requests</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{totalCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
              <IconClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Action</p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
              <IconPackage className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Ordered Parts</p>
              <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{orderedCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
              <IconAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Urgent Active</p>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{urgentCount}</p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search part, code, vendor, job #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
              <IconFilter className="w-3.5 h-3.5" />
              Filters:
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] shrink-0 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] shrink-0 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
            </select>

            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] shrink-0 font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Vendors ({vendors.length})</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  🏬 {v.name}
                </option>
              ))}
            </select>

            {(statusFilter !== "ALL" || priorityFilter !== "ALL" || vendorFilter !== "ALL" || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setPriorityFilter("ALL");
                  setVendorFilter("ALL");
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline shrink-0 px-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Part Request List */}
        <PartRequestList
          requests={filteredRequests}
          vendors={vendors}
          onRefresh={fetchData}
          showJobDetails={true}
        />

        {/* Create Modal */}
        <CreatePartRequestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          vendors={vendors}
          onRequestCreated={fetchData}
        />

        {/* Add Vendor Modal */}
        <CreateVendorModal
          isOpen={isAddVendorModalOpen}
          onClose={() => setIsAddVendorOpen(false)}
          onVendorCreated={fetchData}
        />
      </div>
    </AppShell>
  );
}
