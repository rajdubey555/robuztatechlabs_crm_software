"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Modal, Button, Input, Select, Alert, LoadingSpinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Vendor } from "@/types/vendor";
import { PartRequestPriority } from "@/types/partRequest";
import { RepairJob } from "@/types/job";
import {
  buildPartRequestWhatsAppMessage,
  buildMultiPartRequestWhatsAppMessage,
  buildWhatsAppClickUrl,
  MultiPartItem
} from "@/services/whatsappService";

import { CreateVendorModal } from "@/components/vendors/CreateVendorModal";

export interface CreatePartRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairJob?: RepairJob;
  vendors?: Vendor[];
  onRequestCreated?: () => void;
  onSuccess?: () => void;
}

interface FormPartItem {
  id: string;
  part_name: string;
  quantity: number;
  notes: string;
  selectedFile: File | null;
  imagePreview: string | null;
}

const createEmptyItem = (): FormPartItem => ({
  id: Math.random().toString(36).substring(7),
  part_name: "",
  quantity: 1,
  notes: "",
  selectedFile: null,
  imagePreview: null,
});

export function CreatePartRequestModal({
  isOpen,
  onClose,
  repairJob,
  vendors: propVendors,
  onRequestCreated,
  onSuccess,
}: CreatePartRequestModalProps) {
  const supabase = createClient();

  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>(propVendors || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vendor Modal State
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);

  // Common Header State
  const [vendorId, setVendorId] = useState("");
  const [priority, setPriority] = useState<PartRequestPriority>("NORMAL");
  const [openWhatsAppOnCreate, setOpenWhatsAppOnCreate] = useState(true);

  // Dynamic Part Items
  const [items, setItems] = useState<FormPartItem[]>([createEmptyItem()]);

  // Fetch Vendors list on open if missing
  useEffect(() => {
    if (!isOpen) return;

    if (propVendors && propVendors.length > 0) {
      setVendors(propVendors);
      if (!vendorId && propVendors.length > 0) {
        setVendorId(propVendors[0].id);
      }
      return;
    }

    async function fetchVendors() {
      setLoadingVendors(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await supabase
          .from("vendors")
          .select("*")
          .order("name", { ascending: true });

        if (fetchErr) throw fetchErr;

        const vendorList = (data as Vendor[]) || [];
        setVendors(vendorList);
        if (vendorList.length > 0) {
          setVendorId(vendorList[0].id);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load vendors.";
        setError(msg);
      } finally {
        setLoadingVendors(false);
      }
    }

    fetchVendors();
  }, [isOpen, propVendors, supabase]);

  // Handle adding another part item row
  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  // Handle removing a part item row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle item input field change
  const handleItemChange = (id: string, field: keyof FormPartItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Handle image selection for specific item
  const handleImageChange = (id: string, e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];

    if (!file) {
      handleItemChange(id, "selectedFile", null);
      handleItemChange(id, "imagePreview", null);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid image file. Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size exceeds 5MB limit.");
      return;
    }

    handleItemChange(id, "selectedFile", file);
    const reader = new FileReader();
    reader.onloadend = () => {
      handleItemChange(id, "imagePreview", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload item image to Supabase
  const uploadImageToSupabase = async (file: File, previewUrl: string | null): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `part_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `requests/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("part-request-images")
        .upload(filePath, file);

      if (uploadErr) {
        console.warn("Supabase storage upload failed, using Data URL fallback:", uploadErr.message);
        return previewUrl;
      }

      const { data: publicUrlData } = supabase.storage
        .from("part-request-images")
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch {
      return previewUrl;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!vendorId) {
      setError("Please select a vendor.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].part_name.trim()) {
        setError(`Item #${i + 1}: Part Name is required.`);
        return;
      }
      if (items[i].quantity < 1) {
        setError(`Item #${i + 1}: Quantity must be at least 1.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      let currentEmployeeId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: empData } = await supabase
            .from("employees")
            .select("id")
            .eq("email", user.email)
            .maybeSingle();
          if (empData) currentEmployeeId = empData.id;
        }
      } catch (e) {
        console.warn("Employee lookup warning:", e);
      }

      // Prepare payload for all items
      const insertRows = [];

      for (const item of items) {
        let uploadedImageUrl: string | null = null;
        if (item.selectedFile) {
          uploadedImageUrl = await uploadImageToSupabase(item.selectedFile, item.imagePreview);
        }

        const priorityVal = priority.toLowerCase();
        insertRows.push({
          repair_job_id: repairJob?.id || null,
          requested_by: currentEmployeeId,
          vendor_id: vendorId,
          part_name: item.part_name.trim(),
          quantity: Number(item.quantity),
          image_url: uploadedImageUrl,
          priority: priorityVal,
          notes: item.notes.trim() || null,
          status: "requested",
        });
      }

      // Insert into DB
      const { data: insertedData, error: insertErr } = await supabase
        .from("part_requests")
        .insert(insertRows)
        .select(`
          *,
          vendor:vendors(*)
        `);

      if (insertErr) {
        console.error("Supabase insert error details:", insertErr);
        throw new Error(insertErr.message || insertErr.details || "Failed to insert part request");
      }

      // Reset form
      setItems([createEmptyItem()]);
      if (onSuccess) onSuccess();
      if (onRequestCreated) onRequestCreated();
      onClose();

      // Trigger WhatsApp
      if (openWhatsAppOnCreate && insertedData && insertedData.length > 0) {
        const selectedVendor = insertedData[0].vendor as Vendor;
        const customerName = repairJob?.customer?.full_name || "Client";
        const model = repairJob?.device?.model || "";

        let messageText = "";

        if (insertedData.length === 1) {
          const req = insertedData[0];
          messageText = buildPartRequestWhatsAppMessage({
            request_code: req.request_code || "PR-REQ",
            job_card_number: repairJob?.job_code,
            customer_name: customerName,
            device_model: model,
            part_name: req.part_name,
            quantity: req.quantity,
            priority: req.priority,
            notes: req.notes,
            image_url: req.image_url,
          });
        } else {
          const multiItems: MultiPartItem[] = insertedData.map((d: any) => ({
            part_name: d.part_name,
            quantity: d.quantity,
            notes: d.notes,
            image_url: d.image_url,
            request_code: d.request_code,
          }));

          messageText = buildMultiPartRequestWhatsAppMessage({
            vendor_name: selectedVendor?.name,
            items: multiItems,
            priority,
            job_card_number: repairJob?.job_code,
            customer_name: customerName,
            device_model: model,
          });
        }

        const waPhone = selectedVendor?.phone || selectedVendor?.whatsapp_number || "";
        const waUrl = buildWhatsAppClickUrl(waPhone, messageText);
        window.open(waUrl, "_blank");
      }
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "Failed to create part requests.";
      console.error("Part Request Creation Error:", err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={`🔧 Request Spare Parts ${repairJob ? `— ${repairJob.job_code}` : ""}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Vendor & Priority Selection Header */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Vendor *
              </label>
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(true)}
                disabled={submitting}
                className="text-[11px] font-bold text-[#009688] hover:text-[#00796B] hover:underline flex items-center gap-1"
              >
                + Quick Add Vendor
              </button>
            </div>

            {loadingVendors ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <LoadingSpinner size="sm" className="text-[#009688]" />
                <span>Loading vendors...</span>
              </div>
            ) : vendors.length > 0 ? (
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#009688] font-medium"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.phone || "No Phone"}){v.is_preferred ? " ★ Preferred" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">No vendors available</span>
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(true)}
                  className="text-xs font-bold text-[#009688] bg-white px-2 py-1 rounded border border-teal-200"
                >
                  + Add Vendor Now
                </button>
              </div>
            )}
          </div>

          <Select
            label="Order Priority Level *"
            required
            value={priority}
            onChange={(e) => setPriority(e.target.value as PartRequestPriority)}
            disabled={submitting}
            options={[
              { label: "Normal Priority", value: "NORMAL" },
              { label: "🚨 Urgent Priority", value: "URGENT" },
            ]}
          />
        </div>

        {/* SINGLE UNIFIED CONTAINER FOR ALL PART ITEMS */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          {/* Container Header */}
          <div className="bg-slate-100/70 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📦</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Requested Spare Parts List
              </h4>
              <span className="bg-[#009688] text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                {items.length} {items.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              disabled={submitting}
              className="text-xs font-bold text-[#009688] hover:text-[#00796B] bg-white dark:bg-slate-900 hover:bg-teal-50 px-3 py-1.5 rounded-lg border border-[#009688]/30 shadow-2xs flex items-center gap-1 transition-all active:scale-95"
            >
              + Add Another Item
            </button>
          </div>

          {/* Inline Rows List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors space-y-3"
              >
                {/* Row Header & Item Number */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-black">
                      {index + 1}
                    </span>
                    <span>Item #{index + 1}</span>
                  </span>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={submitting}
                      className="text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* Inline Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* Part Name */}
                  <div className="md:col-span-5">
                    <input
                      type="text"
                      required
                      placeholder="Part Name * (e.g. MacBook Display Assembly / Battery)"
                      value={item.part_name}
                      onChange={(e) => handleItemChange(item.id, "part_name", e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#009688] font-medium"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2">
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                      <span className="px-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 py-2 border-r border-slate-200 dark:border-slate-800">
                        Qty
                      </span>
                      <input
                        type="number"
                        min={1}
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "quantity",
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        disabled={submitting}
                        className="w-full px-2 py-1.5 text-xs text-center font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Notes / Specs */}
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      placeholder="Notes / Specs (e.g. Model A2338 Gray)"
                      value={item.notes}
                      onChange={(e) => handleItemChange(item.id, "notes", e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#009688]"
                    />
                  </div>

                  {/* Reference Image Upload */}
                  <div className="md:col-span-2 flex items-center gap-2">
                    {item.imagePreview ? (
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            handleItemChange(item.id, "selectedFile", null);
                            handleItemChange(item.id, "imagePreview", null);
                          }}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-[11px] font-medium text-[#009688] hover:text-[#00796b] bg-teal-50 dark:bg-teal-950/40 px-2.5 py-2 rounded-lg border border-teal-200 dark:border-teal-900 flex items-center justify-center gap-1 w-full shrink-0 truncate">
                        <span>📷</span>
                        <span>Photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleImageChange(item.id, e)}
                          disabled={submitting}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Add Row Footer Bar inside Container */}
          <div className="bg-slate-50/70 dark:bg-slate-950/40 p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Click + Add Another Item to request multiple parts in one single purchase order.
            </span>

            <button
              type="button"
              onClick={handleAddItem}
              disabled={submitting}
              className="text-xs font-bold text-[#009688] hover:text-[#00796B] flex items-center gap-1 hover:underline"
            >
              + Add Another Item
            </button>
          </div>
        </div>

        {/* WhatsApp Checkbox */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <input
            id="wa_toggle"
            type="checkbox"
            checked={openWhatsAppOnCreate}
            onChange={(e) => setOpenWhatsAppOnCreate(e.target.checked)}
            disabled={submitting}
            className="h-4 w-4 rounded border-slate-300 text-[#009688] focus:ring-[#009688] cursor-pointer"
          />
          <label htmlFor="wa_toggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
            💬 Open pre-filled WhatsApp PO message for Vendor immediately on creation
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            className="px-6 shadow-md bg-[#009688] hover:bg-[#00796b]"
          >
            Submit Request ({items.length} {items.length === 1 ? "Part" : "Parts"})
          </Button>
        </div>
      </form>

      {/* Quick Add Vendor Modal */}
      <CreateVendorModal
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        onVendorCreated={(newVendor) => {
          if (newVendor) {
            setVendors((prev) => [newVendor, ...prev]);
            setVendorId(newVendor.id);
          }
        }}
      />
    </Modal>
  );
}
