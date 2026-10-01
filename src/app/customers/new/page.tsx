"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CustomerFormData } from "@/types/customer";
import { AppShell } from "@/components/layout/AppShell";
import { Alert } from "@/components/ui";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);
    }
    loadUser();
  }, [supabase]);

  const handleCreateCustomer = async (formData: CustomerFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("customers")
        .insert([
          {
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim(),
            alternate_phone: formData.alternate_phone?.trim() || null,
            email: formData.email?.trim() || null,
            address: formData.address?.trim() || null,
            city: formData.city?.trim() || null,
            notes: formData.notes?.trim() || null,
          },
        ])
        .select()
        .single();

      if (insertError) {
        setError("Failed to create customer: " + insertError.message);
        setSubmitting(false);
        return;
      }

      // Successful creation -> Redirect to Customer Detail page
      if (data && data.id) {
        router.push(`/customers/${data.id}`);
        router.refresh();
      } else {
        router.push("/customers");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AppShell userEmail={userEmail}>
        {/* Header & Back Link */}
        <div className="space-y-1">
          <Link
            href="/customers"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            ← Back to Customers
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Add New Customer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create a new customer profile for laptop/mobile repair jobs
          </p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <CustomerForm
          onSubmit={handleCreateCustomer}
          isLoading={submitting}
          submitButtonText="Create Customer"
        />
    </AppShell>
  );
}
