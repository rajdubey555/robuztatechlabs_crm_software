"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Employee, EmployeeFormData } from "@/types/employee";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, Button, LoadingSpinner, Badge } from "@/components/ui";
import { EmployeeForm } from "@/components/employees/EmployeeForm";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
        }

        const { data, error: fetchErr } = await supabase
          .from("employees")
          .select("*")
          .eq("id", employeeId)
          .single();

        if (fetchErr) throw fetchErr;
        setEmployee(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load employee details.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [employeeId, supabase]);

  const handleSubmit = async (formData: EmployeeFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        display_name: formData.display_name?.trim() || null,
        phone: formData.phone?.trim() || null,
        alternate_phone: formData.alternate_phone?.trim() || null,
        email: formData.email?.trim() || null,
        id_number: formData.id_number?.trim() || null,
        gender: formData.gender || null,
        dob: formData.dob || null,
        role: formData.role,
        specialization: formData.specialization || null,
        is_active: formData.is_active,
        address_line: formData.address_line?.trim() || null,
        region_state: formData.region_state?.trim() || null,
        city_town: formData.city_town?.trim() || null,
        postal_code: formData.postal_code?.trim() || null,
        bank_account_name: formData.bank_account_name?.trim() || null,
        bank_name: formData.bank_name?.trim() || null,
        bank_branch: formData.bank_branch?.trim() || null,
        bank_account_number: formData.bank_account_number?.trim() || null,
        bank_ifsc: formData.bank_ifsc?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("employees")
        .update(payload)
        .eq("id", employeeId);

      if (updateError) throw updateError;

      router.push(`/employees/${employeeId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update employee.";
      setError(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell userEmail={userEmail}>
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" className="text-[#009688]" />
        </div>
      </AppShell>
    );
  }

  if (error || !employee) {
    return (
      <AppShell userEmail={userEmail}>
        <div className="space-y-4">
          <Alert variant="error" title="Error Loading Employee">
            {error || "Employee record not found."}
          </Alert>
          <Link href="/employees">
            <Button variant="outline" size="sm">
              &larr; Back to Employees
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell userEmail={userEmail}>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/employees" className="hover:text-[#009688] transition-colors">
            Employees
          </Link>
          <span>/</span>
          <Link href={`/employees/${employee.id}`} className="hover:text-[#009688] transition-colors">
            {employee.employee_code}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Edit Profile</span>
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Edit Employee Profile
              </h1>
              <Badge variant="primary">{employee.employee_code}</Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Update staff contact details, role, specialization, or active status.
            </p>
          </div>

          <Link href={`/employees/${employee.id}`}>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <EmployeeForm
          initialData={{
            full_name: employee.full_name,
            display_name: employee.display_name || "",
            phone: employee.phone || "",
            alternate_phone: employee.alternate_phone || "",
            email: employee.email || "",
            id_number: employee.id_number || "",
            gender: employee.gender || "",
            dob: employee.dob || "",
            role: employee.role,
            specialization: employee.specialization || "general",
            is_active: employee.is_active,
            address_line: employee.address_line || "",
            region_state: employee.region_state || "",
            city_town: employee.city_town || "",
            postal_code: employee.postal_code || "",
            bank_account_name: employee.bank_account_name || "",
            bank_name: employee.bank_name || "",
            bank_branch: employee.bank_branch || "",
            bank_account_number: employee.bank_account_number || "",
            bank_ifsc: employee.bank_ifsc || "",
          }}
          onSubmit={handleSubmit}
          isLoading={submitting}
          submitButtonText="Save Changes"
          isEdit
        />
    </AppShell>
  );
}
