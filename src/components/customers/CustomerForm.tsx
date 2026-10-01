"use client";

import { useState, FormEvent } from "react";
import { CustomerFormData, CustomerFormErrors } from "@/types/customer";
import { Input, Button, Card, CardContent } from "@/components/ui";

export interface CustomerFormProps {
  initialData?: CustomerFormData;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function CustomerForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonText = "Save Customer",
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    full_name: initialData?.full_name || "",
    phone: initialData?.phone || "",
    alternate_phone: initialData?.alternate_phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState<CustomerFormErrors>({});

  const validate = (): boolean => {
    const newErrors: CustomerFormErrors = {};

    // Full Name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required.";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Full name must be at least 2 characters.";
    }

    // Phone validation (Indian 10-digit number format)
    const phoneRegex = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = "Please enter a valid 10-digit Indian phone number.";
    }

    // Alternate Phone validation (optional)
    if (formData.alternate_phone && formData.alternate_phone.trim()) {
      const cleanAltPhone = formData.alternate_phone.replace(/[\s-]/g, "");
      if (!phoneRegex.test(cleanAltPhone)) {
        newErrors.alternate_phone = "Please enter a valid alternate phone number.";
      }
    }

    // Email validation (optional)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
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

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              error={errors.full_name}
              disabled={isLoading}
            />

            <Input
              label="Phone Number"
              required
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              error={errors.phone}
              disabled={isLoading}
            />

            <Input
              label="Alternate Phone"
              placeholder="e.g. 9123456789 (Optional)"
              value={formData.alternate_phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, alternate_phone: e.target.value })
              }
              error={errors.alternate_phone}
              disabled={isLoading}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. rahul@example.com (Optional)"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
              disabled={isLoading}
            />

            <Input
              label="City"
              placeholder="e.g. Mumbai / Bangalore (Optional)"
              value={formData.city || ""}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              error={errors.city}
              disabled={isLoading}
            />

            <div className="md:col-span-2">
              <Input
                label="Street Address"
                placeholder="e.g. Shop #12, MG Road (Optional)"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                error={errors.address}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                rows={3}
                placeholder="Any special remarks or preferences (Optional)"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                disabled={isLoading}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#009688] focus:outline-none focus:ring-2 focus:ring-[#009688]/20 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
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
