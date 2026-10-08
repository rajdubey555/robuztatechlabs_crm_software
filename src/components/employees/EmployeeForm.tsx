"use client";

import { useState, FormEvent } from "react";
import { EmployeeFormData, EmployeeFormErrors, EmployeeRole, EmployeeSpecialization } from "@/types/employee";
import { Input, Select, Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

export interface EmployeeFormProps {
  initialData?: EmployeeFormData;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  isEdit?: boolean;
}

const ROLE_OPTIONS: { label: string; value: EmployeeRole }[] = [
  { label: "Technician", value: "technician" },
  { label: "Manager", value: "manager" },
  { label: "Receptionist", value: "reception" },
  { label: "Admin", value: "admin" },
  { label: "Purchase Specialist", value: "purchase" },
  { label: "Accountant", value: "accountant" },
];

const SPEC_OPTIONS: { label: string; value: string }[] = [
  { label: "Drone Specialist (Drones, Gimbal, FC)", value: "drone" },
  { label: "Laptop Specialist", value: "laptop" },
  { label: "Mobile Specialist", value: "mobile" },
  { label: "Apple Devices (MacBook / iPhone)", value: "apple" },
  { label: "Hardware & Chip-level Repair", value: "hardware" },
  { label: "Software & OS Servicing", value: "software" },
  { label: "General Repair", value: "general" },
];

const GENDER_OPTIONS = [
  { label: "Select Gender", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

export function EmployeeForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonText = "Save Employee",
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: initialData?.full_name || "",
    display_name: initialData?.display_name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    alternate_phone: initialData?.alternate_phone || "",
    id_number: initialData?.id_number || "",
    gender: initialData?.gender || "",
    dob: initialData?.dob || "",
    role: initialData?.role || "technician",
    specialization: initialData?.specialization || "laptop",
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    address_line: initialData?.address_line || "",
    region_state: initialData?.region_state || "",
    city_town: initialData?.city_town || "",
    postal_code: initialData?.postal_code || "",
    bank_account_name: initialData?.bank_account_name || "",
    bank_name: initialData?.bank_name || "",
    bank_branch: initialData?.bank_branch || "",
    bank_account_number: initialData?.bank_account_number || "",
    bank_ifsc: initialData?.bank_ifsc || "",
  });

  const [errors, setErrors] = useState<EmployeeFormErrors>({});

  const validate = (): boolean => {
    const newErrors: EmployeeFormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Employee name is required.";
    }

    if (!formData.role) {
      newErrors.role = "Employee role is required.";
    }

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
    <div className="space-y-6">
      {/* Employee Form Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-900 dark:text-white">
            👤 Employee Details & Account Form
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Role permissions are managed globally by Admin:
          </span>
          <a
            href="/permissions"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#009688] hover:underline bg-[#e0f2f1] dark:bg-[#004d40]/40 px-3 py-1.5 rounded-lg"
          >
            <span>🔒</span> Go to Permissions →
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: EMPLOYEE INFORMATION */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span>👤</span> Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Employee Name *"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.full_name}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    full_name: val,
                    display_name: prev.display_name === prev.full_name || !prev.display_name ? val : prev.display_name,
                  }));
                }}
                error={errors.full_name}
                disabled={isLoading}
              />

              <Input
                label="Display Name"
                placeholder="e.g. Rahul S"
                value={formData.display_name || ""}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                disabled={isLoading}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="rahul@robuzta.com (Optional)"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                disabled={isLoading}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 rounded-lg border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    +91
                  </span>
                  <div className="flex-1">
                    <Input
                      placeholder="9876543210"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <Input
                label="Phone Number / Alternate"
                placeholder="Alternate contact (Optional)"
                value={formData.alternate_phone || ""}
                onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                disabled={isLoading}
              />

              <Input
                label="Identification Number"
                placeholder="Govt ID / Aadhaar / PAN / Emp ID"
                value={formData.id_number || ""}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                disabled={isLoading}
              />

              <Select
                label="Gender"
                options={GENDER_OPTIONS}
                value={formData.gender || ""}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                disabled={isLoading}
              />

              <Input
                label="Date of Birth"
                type="date"
                value={formData.dob || ""}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                disabled={isLoading}
              />

              <Select
                label="Employee Role *"
                required
                disabled={isLoading}
                options={ROLE_OPTIONS}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
                error={errors.role}
              />

              <Select
                label="Specialization"
                disabled={isLoading}
                options={SPEC_OPTIONS}
                value={formData.specialization || "general"}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value as EmployeeSpecialization })}
              />

              <div className="flex items-center space-x-3 pt-6">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-slate-300 text-[#009688] focus:ring-[#009688]"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Active Account (Allowed for job assignments)
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: ADDRESS DETAILS (OPTIONAL) */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span>📍</span> Address Details <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Address Line"
                  placeholder="Street, Landmark, Apartment..."
                  value={formData.address_line || ""}
                  onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <Input
                label="City / Town"
                placeholder="e.g. Mumbai"
                value={formData.city_town || ""}
                onChange={(e) => setFormData({ ...formData, city_town: e.target.value })}
                disabled={isLoading}
              />

              <Input
                label="Region / State"
                placeholder="e.g. Maharashtra"
                value={formData.region_state || ""}
                onChange={(e) => setFormData({ ...formData, region_state: e.target.value })}
                disabled={isLoading}
              />

              <Input
                label="Postal / ZIP Code"
                placeholder="e.g. 400001"
                value={formData.postal_code || ""}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: BANK DETAILS (OPTIONAL) */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span>🏦</span> Bank Details <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Account Name"
                placeholder="Account Holder Name"
                value={formData.bank_account_name || ""}
                onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                disabled={isLoading}
              />

              <Input
                label="Bank Name"
                placeholder="e.g. HDFC Bank"
                value={formData.bank_name || ""}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                disabled={isLoading}
              />

              <Input
                label="Branch"
                placeholder="e.g. Andheri East"
                value={formData.bank_branch || ""}
                onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                disabled={isLoading}
              />

              <Input
                label="Account Number"
                placeholder="e.g. 5010023456789"
                value={formData.bank_account_number || ""}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                disabled={isLoading}
              />

              <Input
                label="IFSC Code"
                placeholder="e.g. HDFC0001234"
                value={formData.bank_ifsc || ""}
                onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* FORM ACTION FOOTER */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="min-w-[160px]"
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  );
}
