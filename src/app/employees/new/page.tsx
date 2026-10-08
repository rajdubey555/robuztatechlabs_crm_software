"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { EmployeeFormData } from "@/types/employee";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, Button } from "@/components/ui";
import { EmployeeForm } from "@/components/employees/EmployeeForm";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export default function AddEmployeePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    }
    checkAuth();
  }, [supabase]);

  const handleSubmit = async (formData: EmployeeFormData) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create Supabase Auth User if Email and Password are provided
      if (formData.email && formData.password) {
        const secondaryAuth = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false } }
        );

        const { error: authError } = await secondaryAuth.auth.signUp({
          email: formData.email.trim(),
          password: formData.password.trim(),
          options: {
            data: {
              full_name: formData.full_name.trim(),
              role: formData.role,
            },
          },
        });

        if (authError && !authError.message.includes("already registered")) {
          console.warn("Notice during auth user signup:", authError.message);
        }
      }

      // 2. Insert into employees DB table
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
      };

      const { data, error: insertError } = await supabase
        .from("employees")
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      router.push(`/employees/${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add employee.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <AppShell userEmail={userEmail}>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/employees" className="hover:text-[#009688] transition-colors">
            Employees
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Add New Employee</span>
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Add New Employee
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create a new technician, manager, or staff profile for repair job assignments.
            </p>
          </div>

          <Link href="/employees">
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
          onSubmit={handleSubmit}
          isLoading={loading}
          submitButtonText="Create Employee Profile"
        />
    </AppShell>
  );
}
