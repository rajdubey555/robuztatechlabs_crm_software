"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Vendor,
  getVendors,
  deleteVendor,
  togglePreferredVendor,
  buildWhatsAppClickUrl,
} from "@/modules/procurement";
import { VendorModal } from "./VendorModal";
import {
  Modal,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import { AppShell } from "@/components/layout/AppShell";
import {
  Store,
  Building2,
  Plus,
  Search,
  RefreshCw,
  Star,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Package,
  CheckCircle2,
  User,
} from "lucide-react";

interface VendorsPageClientProps {
  initialVendors?: Vendor[];
  userEmail?: string;
}

export function VendorsPageClient({
  initialVendors = [],
  userEmail,
}: VendorsPageClientProps) {
  const {
    selectedBranch,
    selectedCategory,
    activeBranchInfo,
    activeCategoryInfo,
    isFiltered,
    clearFilters,
  } = useBranchContext();

  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modal States
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);

  // Delete Confirmation Modal State
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await getVendors();
      if (res.error) throw new Error(res.error);
      setVendors(res.data);
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
      const res = await deleteVendor(vendorToDelete.id);
      if (res.error) {
        alert("Failed to delete vendor: " + res.error);
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

  const handleTogglePreferred = async (vendor: Vendor) => {
    try {
      const res = await togglePreferredVendor(vendor.id, vendor.is_preferred);
      if (res.success) fetchVendors();
    } catch (err) {
      console.error("Error toggling preferred status:", err);
    }
  };

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        vendors
          .map((v) => v.category)
          .filter((c): c is string => Boolean(c))
      )
    );
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.contact_person && v.contact_person.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q)) ||
        (v.vendor_code && v.vendor_code.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === "ALL" || v.category === categoryFilter;

      const matchesPreferred = !preferredOnly || v.is_preferred;

      return matchesSearch && matchesCategory && matchesPreferred;
    });
  }, [vendors, searchQuery, categoryFilter, preferredOnly]);

  const totalCount = vendors.length;
  const preferredCount = vendors.filter((v) => v.is_preferred).length;
  const activeCount = vendors.filter((v) => v.is_active).length;

  const handleOpenWhatsApp = (v: Vendor) => {
    const phone = v.whatsapp_number || v.phone;
    if (!phone) {
      alert("No phone or WhatsApp contact number available for " + v.name);
      return;
    }
    const msg = `Hello ${v.name}, reaching out regarding spare parts inquiry from Robuzta Service Center.`;
    const url = buildWhatsAppClickUrl(phone, msg);
    window.open(url, "_blank");
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="w-full space-y-4">
        
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688] shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Vendors & Suppliers
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {filteredVendors.length}
                </span>
                {activeBranchInfo && (
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    • {activeBranchInfo.shortName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Directory of verified spare part suppliers, procurement contacts, and component distributors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* View Mode Switcher */}
            <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-800 text-[#009688] shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-800 text-[#009688] shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchVendors}
              disabled={loading}
              className="h-9 w-9 p-0 shrink-0"
              title="Refresh vendor directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#009688]" : "text-slate-500"}`} />
            </Button>

            {/* Add Vendor Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              className="h-9 px-3.5 text-xs font-semibold shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Vendor
            </Button>
          </div>
        </div>

        {/* Workspace Context Filter Banner */}
        {isFiltered && (
          <div className="flex items-center justify-between bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-xl px-4 py-2 text-xs text-teal-900 dark:text-teal-200 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-teal-700 dark:text-teal-400">Context:</span>
              {selectedBranch !== "all" && (
                <span className="bg-white dark:bg-teal-900 font-medium px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 text-slate-800 dark:text-slate-200">
                  {activeBranchInfo?.name || selectedBranch}
                </span>
              )}
              {selectedCategory !== "all" && (
                <span className="bg-white dark:bg-teal-900 font-medium px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 text-slate-800 dark:text-slate-200">
                  {activeCategoryInfo?.name || selectedCategory}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-xs text-teal-700 dark:text-teal-300 hover:underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Compact Metrics Bar spanning full width */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Vendors
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {totalCount}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-[#009688] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Preferred Partners
              </p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {preferredCount}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Suppliers
              </p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {activeCount}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Categories
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {categories.length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Full-Width Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5 w-full">
          {/* Search Input stretching to fill available width */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendor name, code, contact person, phone, email, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setPreferredOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer shrink-0 ${
                preferredOnly
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${preferredOnly ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
              <span>Preferred Only</span>
            </button>
          </div>
        </div>

        {/* Vendors Content: Table or Grid */}
        {filteredVendors.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-3 shadow-2xs w-full">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No Vendors Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No supplier matches your active search or filter criteria.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              className="mt-2"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Vendor Profile
            </Button>
          </div>
        ) : viewMode === "table" ? (
          /* Table View covering full space */
          <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="w-12 text-center py-3.5 pl-3">★</th>
                  <th className="py-3.5 px-3">Vendor</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Contact Person</th>
                  <th className="py-3.5 px-3">Direct Contact</th>
                  <th className="py-3.5 px-3">Email</th>
                  <th className="py-3.5 px-3">Location & Address</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Preferred Star Toggle */}
                    <td className="text-center py-3 pl-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePreferred(vendor)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={vendor.is_preferred ? "Remove preferred partner" : "Set as preferred partner"}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            vendor.is_preferred
                              ? "text-amber-500 fill-amber-500"
                              : "text-slate-300 dark:text-slate-600 hover:text-amber-400"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Vendor Name & Code */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {vendor.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {vendor.vendor_code || "VND"}
                        </span>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-[#009688] border border-teal-200/60 dark:border-teal-900/60 whitespace-nowrap">
                        {vendor.category || "General Parts"}
                      </span>
                    </td>

                    {/* Contact Person */}
                    <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {vendor.contact_person ? (
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{vendor.contact_person}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* WhatsApp & Phone */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(vendor)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                          title="Open WhatsApp chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {vendor.phone || vendor.whatsapp_number || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {vendor.email ? (
                        <a
                          href={`mailto:${vendor.email}`}
                          className="flex items-center gap-1.5 hover:text-[#009688] transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{vendor.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Location & City - Fills full space */}
                    <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                      {vendor.address || vendor.city ? (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            {vendor.city && (
                              <span className="font-medium text-slate-800 dark:text-slate-200 mr-1.5">
                                {vendor.city}:
                              </span>
                            )}
                            <span>{vendor.address || "—"}</span>
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {vendor.is_active !== false ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 pr-4 pl-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href="/part-requests"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#009688] hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                          title="View Part Requests"
                        >
                          <Package className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(vendor)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Vendor"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setVendorToDelete(vendor)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid / Card View spanning full width */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className={`bg-white dark:bg-slate-900 rounded-xl p-4 border transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-4 ${
                  vendor.is_preferred
                    ? "border-amber-300/80 dark:border-amber-900/60 ring-1 ring-amber-400/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Preferred badge & Code */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePreferred(vendor)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        vendor.is_preferred
                          ? "text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          : "text-slate-400 bg-slate-50 border-slate-200 hover:text-amber-600"
                      }`}
                    >
                      <Star className={`w-3 h-3 ${vendor.is_preferred ? "fill-amber-500 text-amber-500" : ""}`} />
                      <span>{vendor.is_preferred ? "Preferred Partner" : "Set Preferred"}</span>
                    </button>

                    <span className="font-mono text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {vendor.vendor_code || "VND"}
                    </span>
                  </div>

                  {/* Vendor Name & Category */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {vendor.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium text-[#009688]">
                        {vendor.category || "General Parts"}
                      </span>
                      {vendor.city && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {vendor.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    {vendor.contact_person && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {vendor.contact_person}
                        </span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-2 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.address && (
                      <div className="flex items-start gap-2 pt-0.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[11px]">{vendor.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(vendor)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex-1 justify-center cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp PO</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <Link
                      href="/part-requests"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#009688] hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                      title="View Orders"
                    >
                      <Package className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(vendor)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVendorToDelete(vendor)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            title="Delete Vendor Profile"
            maxWidth="md"
          >
            <div className="space-y-4 pt-1">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{vendorToDelete.name}</strong> from the vendor directory?
              </p>
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                Existing spare part purchase records and history will remain preserved.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  size="sm"
                  isLoading={deleting}
                  onClick={handleDeleteVendor}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </AppShell>
  );
}
