"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Vendor } from "@/types/vendor";
import { VendorModal } from "./VendorModal";
import { createClient } from "@/lib/supabase/client";
import { buildWhatsAppClickUrl } from "@/services/whatsappService";
import { Modal, Button } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";

// Inline SVG Icon Helpers
function IconVendorStore({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-6 h-6 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconStar({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconPhone({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconSearch({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconRefresh({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IconEdit({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconTrash({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

import { AppShell } from "@/components/layout/AppShell";

interface VendorsPageClientProps {
  initialVendors?: Vendor[];
  userEmail?: string;
}

export function VendorsPageClient({ initialVendors = [], userEmail }: VendorsPageClientProps) {
  const { selectedBranch, selectedCategory, activeBranchInfo, activeCategoryInfo, isFiltered, clearFilters } = useBranchContext();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modal States
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);

  // Delete Confirmation Modal State
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) setVendors(data as Vendor[]);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleOpenAddModal = () => {
    setVendorToEdit(null);
    setIsVendorModalOpen(true);
  };

  const handleOpenEditModal = (vendor: Vendor) => {
    setVendorToEdit(vendor);
    setIsVendorModalOpen(true);
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", vendorToDelete.id);

      if (error) {
        alert("Failed to delete vendor: " + error.message);
      } else {
        fetchVendors();
        setVendorToDelete(null);
      }
    } catch {
      alert("An unexpected error occurred while deleting vendor.");
    } finally {
      setDeleting(false);
    }
  };

  // Quick toggle preferred status
  const handleTogglePreferred = async (vendor: Vendor) => {
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ is_preferred: !vendor.is_preferred })
        .eq("id", vendor.id);

      if (!error) fetchVendors();
    } catch (err) {
      console.error("Error toggling preferred status:", err);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contact_person && v.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.phone && v.phone.includes(searchQuery)) ||
      (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "ALL" || v.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalCount = vendors.length;
  const preferredCount = vendors.filter((v) => v.is_preferred).length;
  const activeCount = vendors.filter((v) => v.is_active).length;
  const categories = Array.from(new Set(vendors.map((v) => v.category).filter(Boolean)));

  const handleOpenWhatsApp = (v: Vendor) => {
    const phone = v.whatsapp_number || v.phone;
    if (!phone) {
      alert("No phone number available for " + v.name);
      return;
    }
    const msg = `Hello ${v.name}, reaching out regarding spare parts inquiry from Robuzta Service Center.`;
    const url = buildWhatsAppClickUrl(phone, msg);
    window.open(url, "_blank");
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#009688] to-[#26a69a] text-white flex items-center justify-center shadow-md">
              <IconVendorStore className="w-6 h-6" />
            </div>
            <span>Spare Parts Vendors & Suppliers</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage, edit & track verified spare part suppliers and contact directory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVendors}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh list"
          >
            <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin text-[#009688]" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#009688] hover:bg-[#00796b] text-white font-medium rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <IconPlus className="w-4 h-4" />
            Add New Vendor
          </button>
        </div>
      </div>

      {/* Active Filter Context Banner */}
      {isFiltered && (
        <div className="flex items-center justify-between bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-xl px-4 py-2.5 text-xs text-teal-800 dark:text-teal-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold">Active Workspace Filter:</span>
            {selectedBranch !== "all" && (
              <span className="bg-teal-100 dark:bg-teal-900 font-semibold px-2 py-0.5 rounded-md border border-teal-300 dark:border-teal-700">
                📍 {activeBranchInfo?.name || selectedBranch}
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="bg-teal-100 dark:bg-teal-900 font-semibold px-2 py-0.5 rounded-md border border-teal-300 dark:border-teal-700">
                {activeCategoryInfo?.icon} {activeCategoryInfo?.name || selectedCategory}
              </span>
            )}
            <span className="text-teal-600 dark:text-teal-400">
              (Viewing verified vendors directory for active context)
            </span>
          </div>
          <button
            onClick={clearFilters}
            className="text-xs text-teal-700 hover:text-teal-900 dark:text-teal-300 underline font-bold"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center shrink-0">
            <IconVendorStore className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Suppliers</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <IconStar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preferred Vendors</p>
            <p className="text-2xl font-black text-amber-500 mt-0.5">{preferredCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 font-extrabold text-xl">
            ✓
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Suppliers</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name, phone, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688] font-medium"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendors Cards Grid */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <span className="text-5xl">🏬</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Vendors Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No vendor matches your search query. Click below to add your first spare parts vendor.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#009688] text-white text-xs font-bold rounded-xl shadow-md"
          >
            + Add New Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group relative overflow-hidden ${
                vendor.is_preferred
                  ? "border-teal-400 dark:border-teal-900/80 ring-2 ring-[#009688]/15"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleTogglePreferred(vendor)}
                        className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                          vendor.is_preferred
                            ? "text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/50 dark:border-amber-900"
                            : "text-slate-400 bg-slate-50 border-slate-200 hover:text-amber-500"
                        }`}
                        title="Click to toggle preferred status"
                      >
                        <IconStar className="w-3 h-3" />
                        {vendor.is_preferred ? "Preferred Supplier" : "Set Preferred"}
                      </button>

                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {vendor.vendor_code || "VND"}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-[#009688] transition-colors mt-1">
                      {vendor.name}
                    </h3>

                    <span className="inline-block text-xs font-bold text-[#009688] bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200/60 dark:border-teal-900/60">
                      {vendor.category || "General Parts"}
                    </span>
                  </div>
                </div>

                {/* Details List */}
                <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                  {vendor.contact_person && (
                    <p className="flex items-center gap-2">
                      <span className="text-slate-400">👤 Contact:</span>
                      <strong className="text-slate-900 dark:text-white">{vendor.contact_person}</strong>
                    </p>
                  )}

                  <p className="flex items-center gap-2 font-mono">
                    <IconPhone className="text-slate-400 shrink-0" />
                    <span>{vendor.phone || "No Phone"}</span>
                  </p>

                  {vendor.email && (
                    <p className="flex items-center gap-2 text-slate-500">
                      <span>✉️</span>
                      <span className="truncate">{vendor.email}</span>
                    </p>
                  )}

                  {vendor.address && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pt-0.5">
                      📍 {vendor.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenWhatsApp(vendor)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 flex-1 justify-center"
                >
                  <span>💬</span> WhatsApp
                </button>

                <Link
                  href={`/part-requests`}
                  className="px-2.5 py-1.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-[#009688] text-xs font-bold rounded-xl flex items-center gap-1 border border-teal-200/80 dark:border-teal-900 transition-all shrink-0"
                  title="View Part Requests"
                >
                  <span>📦</span> Requests
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(vendor)}
                    className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                    title="Edit Vendor Details"
                  >
                    <IconEdit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setVendorToDelete(vendor)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                    title="Delete Vendor"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Vendor Modal */}
      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        vendorToEdit={vendorToEdit}
        onSuccess={fetchVendors}
      />

      {/* Delete Vendor Confirmation Modal */}
      {vendorToDelete && (
        <Modal
          isOpen={Boolean(vendorToDelete)}
          onClose={() => setVendorToDelete(null)}
          title="⚠️ Delete Vendor Confirmation"
          maxWidth="md"
        >
          <div className="space-y-4 pt-1">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Are you sure you want to delete vendor <strong className="text-slate-900 dark:text-white">{vendorToDelete.name}</strong>?
            </p>
            <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
              Warning: This action cannot be undone. Any existing part requests linked to this vendor will remain preserved.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVendorToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                isLoading={deleting}
                onClick={handleDeleteVendor}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Delete Vendor
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </AppShell>
  );
}
