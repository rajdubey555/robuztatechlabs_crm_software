"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "@/components/ui";
import { Expense, ExpenseCategory, PaymentMethod, EXPENSE_CATEGORIES } from "@/types/expense";
import { createExpense, updateExpense } from "@/modules/expenses";
import { createClient } from "@/lib/supabase/client";
import {
  IndianRupee,
  Calendar,
  Building,
  CreditCard,
  Tag,
  User,
  Receipt,
  FileText,
  UploadCloud,
  Image as ImageIcon,
  X,
  Trash2,
} from "lucide-react";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
  onSuccess: () => void;
  vendors?: { id: string; name: string }[];
}

export function ExpenseModal({
  isOpen,
  onClose,
  expenseToEdit,
  onSuccess,
  vendors = [],
}: ExpenseModalProps) {
  const isEditing = Boolean(expenseToEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>("tools_consumables");
  const [branch, setBranch] = useState<"south_bopal" | "tragad" | "both">("both");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paidTo, setPaidTo] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  // Payment Receipt Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title || "");
      setAmount(String(expenseToEdit.amount || ""));
      setCategory(expenseToEdit.category || "tools_consumables");
      setBranch(expenseToEdit.branch || "both");
      setPaymentMethod(expenseToEdit.payment_method || "upi");
      setPaidTo(expenseToEdit.paid_to || "");
      setVendorId(expenseToEdit.vendor_id || "");
      setExpenseDate(expenseToEdit.expense_date || new Date().toISOString().slice(0, 10));
      setNotes(expenseToEdit.notes || "");
      setReceiptUrl(expenseToEdit.receipt_url || "");
      setImagePreview(expenseToEdit.receipt_url || null);
      setSelectedFile(null);
    } else {
      setTitle("");
      setAmount("");
      setCategory("tools_consumables");
      setBranch("both");
      setPaymentMethod("upi");
      setPaidTo("");
      setVendorId("");
      setExpenseDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setReceiptUrl("");
      setImagePreview(null);
      setSelectedFile(null);
    }
    setError(null);
  }, [expenseToEdit, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("Receipt image must be smaller than 15MB.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setReceiptUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title or description for this expense.");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than ₹0.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let finalReceiptUrl = receiptUrl.trim() || null;

    if (selectedFile) {
      setUploadingImage(true);
      try {
        const supabase = createClient();
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `expenses/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from("device-attachments")
          .upload(filePath, selectedFile, { upsert: true });

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from("device-attachments")
            .getPublicUrl(filePath);
          finalReceiptUrl = publicUrlData.publicUrl;
        } else {
          console.warn("Storage upload failed, using Data URL fallback:", uploadErr.message);
          finalReceiptUrl = imagePreview || null;
        }
      } catch (e) {
        console.warn("Storage exception, using preview fallback:", e);
        finalReceiptUrl = imagePreview || null;
      } finally {
        setUploadingImage(false);
      }
    }

    const payload = {
      title: title.trim(),
      amount: parsedAmount,
      category,
      branch,
      payment_method: paymentMethod,
      paid_to: paidTo.trim() || null,
      vendor_id: vendorId || null,
      expense_date: expenseDate,
      notes: notes.trim() || null,
      receipt_url: finalReceiptUrl,
    };

    try {
      if (isEditing && expenseToEdit) {
        const res = await updateExpense(expenseToEdit.id, payload);
        if (res.error) throw new Error(res.error);
      } else {
        const res = await createExpense(payload);
        if (res.error) throw new Error(res.error);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save expense.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Expense Entry" : "Log Company Expense"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            {error}
          </div>
        )}

        {/* Title and Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Expense Title / Description <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. South Bopal Electricity Bill, Solder Wire 500g..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
              />
            </div>
          </div>
        </div>

        {/* Category & Branch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            >
              {Object.values(EXPENSE_CATEGORIES).map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Branch Assignment <span className="text-rose-500">*</span>
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value as "south_bopal" | "tragad" | "both")}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            >
              <option value="both">Both / Central Operations</option>
              <option value="south_bopal">South Bopal Branch</option>
              <option value="tragad">Tragad Branch</option>
            </select>
          </div>
        </div>

        {/* Payment Method & Expense Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            >
              <option value="upi">UPI / GPay / PhonePe</option>
              <option value="cash">Cash / Petty Cash</option>
              <option value="bank_transfer">Net Banking / NEFT / IMPS</option>
              <option value="card">Company Debit/Credit Card</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Expense Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            />
          </div>
        </div>

        {/* Paid To & Linked Vendor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Paid To (Recipient / Payee)
            </label>
            <input
              type="text"
              placeholder="e.g. Torrent Power, Landlord, Amazon, Swiggy..."
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Linked Vendor (Optional)
            </label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            >
              <option value="">No vendor linked</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Screenshot / Receipt Attachment */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              Payment Screenshot / Bill Image
            </span>
            {imagePreview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            )}
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {imagePreview ? (
            <div className="rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/30 dark:bg-teal-950/20 p-2.5 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Receipt Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                  {selectedFile ? selectedFile.name : "Attached Payment Receipt / Screenshot"}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB • Image ready to upload`
                    : "Receipt image on file"}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#009688] font-medium hover:underline pt-0.5 block"
                >
                  Change Image
                </button>
              </div>

              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                title="Remove attachment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#009688] dark:hover:border-[#009688] rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-all group"
            >
              <div className="w-9 h-9 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/40 text-slate-400 group-hover:text-[#009688] flex items-center justify-center transition-colors">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1.5">
                Click to upload payment screenshot or bill
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports PNG, JPG, WebP (up to 15MB)
              </p>
            </div>
          )}

          {/* Optional manual ref / invoice number input */}
          <div className="pt-0.5">
            <input
              type="text"
              placeholder="Or enter Bill / Invoice Ref Code (e.g. INV-2026-9042)"
              value={!selectedFile ? receiptUrl : ""}
              onChange={(e) => {
                if (!selectedFile) setReceiptUrl(e.target.value);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Internal Remarks / Notes
          </label>
          <textarea
            rows={2}
            placeholder="Any extra details about this transaction..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={submitting}
            className="px-4"
          >
            {isEditing ? "Update Expense" : "Save Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
