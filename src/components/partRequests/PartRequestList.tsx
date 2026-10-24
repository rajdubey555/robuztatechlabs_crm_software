"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Badge, Modal, EmptyState } from "@/components/ui";
import { PartRequest, PartRequestStatus, updatePartRequestStatus } from "@/modules/procurement";
import { RepairJob } from "@/types/job";
import { Vendor } from "@/types/vendor";
import { PartRequestStatusBadge, PartRequestPriorityBadge } from "./PartRequestStatusBadge";
import {
  buildPartRequestWhatsAppMessage,
  buildMultiPartRequestWhatsAppMessage,
  buildWhatsAppClickUrl,
  MultiPartItem
} from "@/services/whatsappService";
import {
  Package,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ZoomIn,
  Clock,
  Send,
  FileText
} from "lucide-react";

export interface PartRequestListProps {
  requests: PartRequest[];
  vendors?: Vendor[];
  repairJob?: RepairJob;
  onRefresh: () => void;
  showJobDetails?: boolean;
}

export function PartRequestList({
  requests: initialRequests,
  vendors,
  repairJob,
  onRefresh,
  showJobDetails = false,
}: PartRequestListProps) {
  const [items, setItems] = useState<PartRequest[]>(initialRequests);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Sync internal items when parent requests change
  useEffect(() => {
    setItems(initialRequests);
  }, [initialRequests]);

  // Bulk selection for multi-part operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk selection across all displayed items
  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((r) => r.id));
    }
  };

  // Single Item Status Update
  const handleStatusUpdate = async (requestId: string, newStatus: PartRequestStatus) => {
    setUpdatingId(requestId);

    // Optimistic local UI update
    setItems((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    );

    try {
      const res = await updatePartRequestStatus([requestId], newStatus);

      if (res.error) {
        console.error("Status update error:", res.error);
        alert("Failed to update status: " + res.error);
        onRefresh();
      } else {
        onRefresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      alert("An unexpected error occurred while updating status: " + msg);
      onRefresh();
    } finally {
      setUpdatingId(null);
    }
  };

  // Bulk Status Update (Cancel Selected / Order Selected / Receive Selected)
  const handleBulkStatusUpdate = async (newStatus: PartRequestStatus) => {
    if (selectedIds.length === 0) return;

    setUpdatingId("BULK");

    // Optimistic local UI update
    setItems((prev) =>
      prev.map((r) => (selectedIds.includes(r.id) ? { ...r, status: newStatus } : r))
    );

    try {
      const res = await updatePartRequestStatus(selectedIds, newStatus);

      if (res.error) {
        console.error("Bulk status update error:", res.error);
        alert("Bulk update failed: " + res.error);
        onRefresh();
      } else {
        setSelectedIds([]);
        onRefresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      alert("Bulk update error: " + msg);
      onRefresh();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendWhatsApp = (req: PartRequest) => {
    const vendorPhone = req.vendor?.phone || req.vendor?.whatsapp_number;
    if (!vendorPhone) {
      alert("Vendor phone number is not available for " + (req.vendor?.name || "this vendor"));
      return;
    }

    const jobCode = req.job_card_number || repairJob?.job_code || "JOB-REF";
    const customerName = req.customer_name || repairJob?.customer?.full_name || "Client";
    const model = req.device_model || repairJob?.device?.model || "";

    const messageText = buildPartRequestWhatsAppMessage({
      request_code: req.request_code,
      job_card_number: jobCode,
      customer_name: customerName,
      device_model: model,
      part_name: req.part_name,
      quantity: req.quantity,
      priority: req.priority,
      notes: req.notes,
      image_url: req.image_url,
      requested_by_name: req.requested_by_name,
    });

    const waUrl = buildWhatsAppClickUrl(vendorPhone, messageText);
    window.open(waUrl, "_blank");
  };

  // Send Consolidated WhatsApp message for all checked requests
  const handleSendConsolidatedWhatsApp = () => {
    const selectedRequests = items.filter((r) => selectedIds.includes(r.id));
    if (selectedRequests.length === 0) return;

    // Determine target vendor (use first selected item's vendor)
    const targetVendor = selectedRequests[0].vendor;
    const vendorPhone = targetVendor?.phone || targetVendor?.whatsapp_number;

    if (!vendorPhone) {
      alert("Vendor phone number is not available.");
      return;
    }

    const multiItems: MultiPartItem[] = selectedRequests.map((r) => ({
      part_name: r.part_name,
      quantity: r.quantity,
      notes: r.notes,
      image_url: r.image_url,
      request_code: r.request_code,
    }));

    const isUrgent = selectedRequests.some((r) => r.priority === "URGENT");
    const jobCode = selectedRequests[0].job_card_number || repairJob?.job_code;
    const customerName = selectedRequests[0].customer_name || repairJob?.customer?.full_name;
    const model = selectedRequests[0].device_model || repairJob?.device?.model;

    const messageText = buildMultiPartRequestWhatsAppMessage({
      vendor_name: targetVendor?.name,
      items: multiItems,
      priority: isUrgent ? "URGENT" : "NORMAL",
      job_card_number: jobCode,
      customer_name: customerName,
      device_model: model,
    });

    const waUrl = buildWhatsAppClickUrl(vendorPhone, messageText);
    window.open(waUrl, "_blank");
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="No Spare Part Requests"
        description="No spare part procurement requests match the selected filters."
      />
    );
  }

  const selectedCount = selectedIds.length;

  return (
    <div className="space-y-3">
      {/* Consolidated Action Bar when items selected */}
      {selectedCount > 0 && (
        <div className="bg-[#009688] text-white px-4 py-2.5 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 font-medium text-xs">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
              {selectedCount} / {items.length} Selected
            </span>
            <span>Bulk Operations:</span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
            <button
              onClick={() => handleBulkStatusUpdate("ORDERED")}
              disabled={Boolean(updatingId)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow-xs transition-transform active:scale-95"
            >
              <Package className="w-3.5 h-3.5" />
              Mark Ordered ({selectedCount})
            </button>

            <button
              onClick={() => handleBulkStatusUpdate("RECEIVED")}
              disabled={Boolean(updatingId)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-xs transition-transform active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Received ({selectedCount})
            </button>

            <button
              onClick={() => handleBulkStatusUpdate("CANCELLED")}
              disabled={Boolean(updatingId)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 font-semibold text-white shadow-xs transition-transform active:scale-95"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Selected ({selectedCount})
            </button>

            <button
              onClick={handleSendConsolidatedWhatsApp}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-semibold text-white shadow-xs transition-transform active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp PO
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-medium transition-colors"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Select All Toggle Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 py-0.5">
        <label className="flex items-center gap-2 font-semibold cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none">
          <input
            type="checkbox"
            checked={
              selectedIds.length > 0 &&
              selectedIds.length === items.length
            }
            onChange={toggleSelectAll}
            className="rounded border-slate-300 text-[#009688] focus:ring-[#009688] h-4 w-4"
          />
          <span>Select All Requests ({items.length})</span>
        </label>

        <span className="font-mono text-slate-400 text-[11px]">
          {selectedCount > 0 ? `${selectedCount} selected` : `Total: ${items.length}`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {items.map((req) => {
          const isUpdating = updatingId === req.id || updatingId === "BULK";
          const isSelected = selectedIds.includes(req.id);
          const st = req.status?.toString()?.toUpperCase() || "PENDING";

          return (
            <div
              key={req.id}
              className={`p-3.5 rounded-xl border transition-all bg-white dark:bg-slate-900 ${
                isSelected
                  ? "border-[#009688] ring-2 ring-[#009688]/20 bg-teal-50/10 dark:bg-teal-950/20"
                  : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left Info Group */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Selection Checkbox */}
                  <div className="flex items-center shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(req.id)}
                      className="rounded border-slate-300 text-[#009688] focus:ring-[#009688] h-4 w-4 cursor-pointer"
                    />
                  </div>

                  {/* Thumbnail / Icon */}
                  <div className="shrink-0">
                    {req.image_url ? (
                      <div
                        onClick={() => setPreviewImageUrl(req.image_url || null)}
                        className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group relative bg-slate-100 dark:bg-slate-800"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={req.image_url}
                          alt={req.part_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center text-[#009688] shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Details Column */}
                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Title & Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {req.request_code}
                      </span>

                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize truncate max-w-[200px] sm:max-w-xs">
                        {req.part_name}
                      </h4>

                      <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full">
                        Qty: {req.quantity}
                      </span>

                      <PartRequestPriorityBadge priority={req.priority} />
                    </div>

                    {/* Meta Row: Job + Customer + Vendor + Date */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      {showJobDetails && (req.job_card_number || repairJob?.job_code) && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#009688]">
                          <FileText className="w-3 h-3" />
                          Job #{req.job_card_number || repairJob?.job_code}
                        </span>
                      )}

                      <span>
                        Vendor:{" "}
                        <strong className="text-slate-800 dark:text-slate-200 font-medium">
                          {req.vendor?.name || "Unassigned"}
                        </strong>
                        {req.vendor?.phone ? ` (${req.vendor.phone})` : ""}
                      </span>

                      <span>• {formatDate(req.created_at)}</span>

                      {req.requested_by_name && (
                        <span>• By: {req.requested_by_name}</span>
                      )}
                    </div>

                    {/* Note if available */}
                    {req.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800/80 inline-block max-w-md truncate">
                        Note: {req.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action & Status Group */}
                <div className="flex items-center gap-2 justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* WhatsApp Button */}
                  <button
                    onClick={() => handleSendWhatsApp(req)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                    title="Send WhatsApp PO to Vendor"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp PO</span>
                    <span className="sm:hidden">WhatsApp</span>
                  </button>

                  {/* Status Dropdown Selector acting as interactive status badge */}
                  <div className="relative shrink-0">
                    <select
                      value={st}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleStatusUpdate(req.id, e.target.value as PartRequestStatus)
                      }
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-colors shadow-2xs ${
                        st === "PENDING" || st === "REQUESTED"
                          ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                          : st === "ORDERED"
                          ? "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300"
                          : st === "RECEIVED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="ORDERED">Ordered</option>
                      <option value="RECEIVED">Received</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {previewImageUrl && (
        <Modal
          isOpen={Boolean(previewImageUrl)}
          onClose={() => setPreviewImageUrl(null)}
          title="Part Reference Image Preview"
        >
          <div className="p-2 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageUrl}
              alt="Full Preview"
              className="max-h-[500px] w-auto rounded-xl object-contain shadow-md"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
