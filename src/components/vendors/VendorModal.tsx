"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { Modal, Button, Input, Select, Alert } from "@/components/ui";
import { Vendor, createVendor, updateVendor } from "@/modules/procurement";

export interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorToEdit?: Vendor | null;
  onSuccess: (savedVendor?: Vendor) => void;
}

const CATEGORY_OPTIONS = [
  { label: "Laptop & Mobile Screens", value: "Laptop & Mobile Screens" },
  { label: "Motherboards & ICs", value: "Motherboards & ICs" },
  { label: "MacBook & iPhone Spares", value: "MacBook & iPhone Spares" },
  { label: "Batteries & Power Adapters", value: "Batteries & Power Adapters" },
  { label: "Camera & Body Housing", value: "Camera & Body Housing" },
  { label: "General Parts", value: "General Parts" },
];

export function VendorModal({
  isOpen,
  onClose,
  vendorToEdit,
  onSuccess,
}: VendorModalProps) {
  const isEditing = Boolean(vendorToEdit);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General Parts");
  const [address, setAddress] = useState("");
  const [isPreferred, setIsPreferred] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Populate fields if editing
  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name || "");
      setContactPerson(vendorToEdit.contact_person || "");
      setPhone(vendorToEdit.phone || "");
      setWhatsappNumber(vendorToEdit.whatsapp_number || vendorToEdit.phone || "");
      setEmail(vendorToEdit.email || "");
      setCategory(vendorToEdit.category || "General Parts");
      setAddress(vendorToEdit.address || "");
      setIsPreferred(Boolean(vendorToEdit.is_preferred));
      setIsActive(vendorToEdit.is_active !== false);
    } else {
      setName("");
      setContactPerson("");
      setPhone("");
      setWhatsappNumber("");
      setEmail("");
      setCategory("General Parts");
      setAddress("");
      setIsPreferred(false);
      setIsActive(true);
    }
    setError(null);
  }, [vendorToEdit, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Vendor / Company Name is required.");
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    setSubmitting(true);

    try {
      const finalWhatsapp = whatsappNumber.trim() || phone.trim();

      const payload = {
        name: name.trim(),
        contact_person: contactPerson.trim() || null,
        phone: phone.trim(),
        whatsapp_number: finalWhatsapp,
        email: email.trim() || null,
        category,
        address: address.trim() || null,
        is_preferred: isPreferred,
        is_active: isActive,
      };

      let savedData: Vendor | null = null;

      if (isEditing && vendorToEdit?.id) {
        const res = await updateVendor(vendorToEdit.id, payload);
        if (res.error) throw new Error(res.error);
        savedData = { ...vendorToEdit, ...payload } as Vendor;
      } else {
        const res = await createVendor(payload as Omit<Vendor, "id" | "created_at" | "updated_at">);
        if (res.error || !res.data) throw new Error(res.error || "Failed to create vendor");
        savedData = res.data;
      }

      onSuccess(savedData || undefined);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save vendor.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={isEditing ? `✏️ Edit Vendor — ${vendorToEdit?.name}` : "🏬 Add New Parts Vendor"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Vendor / Company Name *"
            required
            placeholder="e.g. Apex Apple Spare Hub"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />

          <Input
            label="Contact Person Name"
            placeholder="e.g. Ramesh Kumar"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone / Mobile Number *"
            required
            placeholder="e.g. +91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
          />

          <Input
            label="WhatsApp Number (Leave blank for same as Phone)"
            placeholder="e.g. +91 9876543210"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Parts Category *"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
            options={CATEGORY_OPTIONS}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. spares@apexparts.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Shop Address / Market Location
          </label>
          <input
            type="text"
            placeholder="e.g. Shop #42, Nehru Place Market, New Delhi"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={submitting}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#009688]"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPreferred}
              onChange={(e) => setIsPreferred(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-slate-300 text-[#009688] focus:ring-[#009688] cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              ★ Mark as Preferred Supplier
            </span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-slate-300 text-[#009688] focus:ring-[#009688] cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              🟢 Active Supplier
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            className="px-6 bg-[#009688] hover:bg-[#00796b]"
          >
            {isEditing ? "Update Vendor" : "Save Vendor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
