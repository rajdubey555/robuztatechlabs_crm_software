"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import { RepairJobFormData, RepairJobFormErrors, JobPriority } from "@/types/job";
import { Customer } from "@/types/customer";
import { Device } from "@/types/device";
import { Input, Select, Button, Card, CardContent } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import { BRANCHES, CATEGORIES } from "@/types/branch";

export interface JobFormProps {
  customers: Customer[];
  allDevices: Device[];
  initialData?: RepairJobFormData;
  onSubmit: (data: RepairJobFormData) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  isEdit?: boolean;
}

const PRIORITY_OPTIONS: { label: string; value: JobPriority }[] = [
  { label: "Medium (Standard)", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical (Urgent)", value: "critical" },
  { label: "Low", value: "low" },
];

const BRANCH_OPTIONS = [
  { label: `📍 ${BRANCHES.south_bopal.name}`, value: "south_bopal" },
  { label: `📍 ${BRANCHES.tragad.name}`, value: "tragad" },
];

const CATEGORY_OPTIONS = [
  { label: `💻 ${CATEGORIES.laptop_general.name}`, value: "laptop_general" },
  { label: `🛸 ${CATEGORIES.drone.name}`, value: "drone" },
];

export function JobForm({
  customers,
  allDevices,
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonText = "Create Job Card",
  isEdit = false,
}: JobFormProps) {
  const { selectedBranch, selectedCategory } = useBranchContext();

  const [formData, setFormData] = useState<RepairJobFormData>({
    customer_id: initialData?.customer_id || (customers[0]?.id || ""),
    device_id: initialData?.device_id || "",
    branch: initialData?.branch || (selectedBranch !== "all" ? selectedBranch : "south_bopal"),
    category_type: initialData?.category_type || (selectedCategory !== "all" ? selectedCategory : "laptop_general"),
    customer_complaint: initialData?.customer_complaint || "",
    priority: initialData?.priority || "medium",
    estimated_cost: initialData?.estimated_cost !== undefined && initialData?.estimated_cost !== null ? String(initialData.estimated_cost) : "",
    final_cost: initialData?.final_cost !== undefined && initialData?.final_cost !== null ? String(initialData.final_cost) : "",
    expected_delivery_at: initialData?.expected_delivery_at
      ? new Date(initialData.expected_delivery_at).toISOString().slice(0, 16)
      : "",
  });

  const [errors, setErrors] = useState<RepairJobFormErrors>({});

  // Filter devices belonging ONLY to selected customer
  const availableDevices = useMemo(() => {
    if (!formData.customer_id) return [];
    return allDevices.filter((d) => d.customer_id === formData.customer_id);
  }, [allDevices, formData.customer_id]);

  // If customer changes, automatically select the first device of that customer if current selection is invalid
  useEffect(() => {
    if (!isEdit && availableDevices.length > 0) {
      const isCurrentDeviceValid = availableDevices.some((d) => d.id === formData.device_id);
      if (!isCurrentDeviceValid) {
        setFormData((prev) => ({ ...prev, device_id: availableDevices[0].id }));
      }
    }
  }, [formData.customer_id, availableDevices, isEdit, formData.device_id]);

  const validate = (): boolean => {
    const newErrors: RepairJobFormErrors = {};

    if (!formData.customer_id) {
      newErrors.customer_id = "Please select a customer.";
    }

    if (!formData.device_id) {
      newErrors.device_id = "Please select a device belonging to this customer.";
    }

    if (!formData.customer_complaint.trim()) {
      newErrors.customer_complaint = "Customer complaint is required.";
    }

    if (!formData.priority) {
      newErrors.priority = "Priority is required.";
    }

    // Cost validations (>= 0)
    if (formData.estimated_cost !== "" && formData.estimated_cost !== undefined) {
      const num = Number(formData.estimated_cost);
      if (isNaN(num) || num < 0) {
        newErrors.estimated_cost = "Estimated cost must be a positive number.";
      }
    }

    if (formData.final_cost !== "" && formData.final_cost !== undefined) {
      const num = Number(formData.final_cost);
      if (isNaN(num) || num < 0) {
        newErrors.final_cost = "Final cost must be a positive number.";
      }
    }

    // Expected delivery date validation (cannot be in the past)
    if (formData.expected_delivery_at) {
      const deliveryDate = new Date(formData.expected_delivery_at);
      const now = new Date();
      if (deliveryDate.getTime() < now.getTime() - 86400000) {
        newErrors.expected_delivery_at = "Expected delivery cannot be in the past.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const customerOptions = customers.map((c) => ({
    label: `${c.full_name} (${c.customer_code} - ${c.phone})`,
    value: c.id,
  }));

  const deviceOptions = availableDevices.map((d) => ({
    label: `${d.brand} ${d.model} (${d.device_code} - ${d.device_type})`,
    value: d.id,
  }));

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Lab Branch Selection */}
            <Select
              label="Assigned Lab Branch *"
              required
              disabled={isLoading}
              options={BRANCH_OPTIONS}
              value={formData.branch || "south_bopal"}
              onChange={(e) =>
                setFormData({ ...formData, branch: e.target.value as "south_bopal" | "tragad" })
              }
            />

            {/* Service Category Selection */}
            <Select
              label="Repair Category Type *"
              required
              disabled={isLoading}
              options={CATEGORY_OPTIONS}
              value={formData.category_type || "laptop_general"}
              onChange={(e) =>
                setFormData({ ...formData, category_type: e.target.value as "laptop_general" | "drone" })
              }
            />

            {/* Customer Select */}
            <Select
              label="Customer *"
              required
              disabled={isEdit || isLoading || customers.length === 0}
              options={
                customers.length > 0
                  ? customerOptions
                  : [{ label: "No customers available", value: "" }]
              }
              value={formData.customer_id}
              onChange={(e) =>
                setFormData({ ...formData, customer_id: e.target.value })
              }
              error={errors.customer_id}
            />

            {/* Device Select (Filtered by Customer) */}
            <Select
              label="Customer Device *"
              required
              disabled={isEdit || isLoading || availableDevices.length === 0}
              options={
                availableDevices.length > 0
                  ? deviceOptions
                  : [{ label: "No devices found for this customer", value: "" }]
              }
              value={formData.device_id}
              onChange={(e) =>
                setFormData({ ...formData, device_id: e.target.value })
              }
              error={errors.device_id}
              helperText={
                availableDevices.length === 0 && formData.customer_id
                  ? "This customer has no registered devices yet."
                  : undefined
              }
            />

            {/* Priority */}
            <Select
              label="Priority *"
              required
              disabled={isLoading}
              options={PRIORITY_OPTIONS}
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as JobPriority,
                })
              }
              error={errors.priority}
            />

            {/* Expected Delivery Date */}
            <Input
              label="Expected Delivery Date"
              type="datetime-local"
              value={formData.expected_delivery_at || ""}
              onChange={(e) =>
                setFormData({ ...formData, expected_delivery_at: e.target.value })
              }
              error={errors.expected_delivery_at}
              disabled={isLoading}
            />

            {/* Estimated Cost */}
            <Input
              label="Estimated Cost (₹)"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 1500.00 (Optional)"
              value={formData.estimated_cost || ""}
              onChange={(e) =>
                setFormData({ ...formData, estimated_cost: e.target.value })
              }
              error={errors.estimated_cost}
              disabled={isLoading}
            />

            {/* Final Cost (Only editable or displayed when appropriate) */}
            {isEdit && (
              <Input
                label="Final Cost (₹)"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 1800.00 (Optional)"
                value={formData.final_cost || ""}
                onChange={(e) =>
                  setFormData({ ...formData, final_cost: e.target.value })
                }
                error={errors.final_cost}
                disabled={isLoading}
              />
            )}

            {/* Customer Complaint */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Customer Complaint / Issue Description *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe the issue reported by the customer in detail (e.g. Laptop not turning on, Drone camera gimbal error, battery connection issue)"
                value={formData.customer_complaint}
                onChange={(e) =>
                  setFormData({ ...formData, customer_complaint: e.target.value })
                }
                disabled={isLoading}
                className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 dark:bg-slate-800 dark:text-white ${
                  errors.customer_complaint
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-300 focus:border-[#009688] focus:ring-[#009688]/20 dark:border-slate-700"
                }`}
              />
              {errors.customer_complaint && (
                <p className="text-xs text-red-600 mt-1">{errors.customer_complaint}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="min-w-[140px]"
            >
              {submitButtonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
