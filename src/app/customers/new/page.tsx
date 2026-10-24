"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CustomerFormData, createCustomer, CustomerForm } from "@/modules/customers";
import { AppShell } from "@/components/layout/AppShell";
import { Alert } from "@/components/ui";
import { ArrowLeft, UserPlus } from "lucide-react";

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

    const { data, error: insertError } = await createCustomer(formData);

    if (insertError) {
      setError("Failed to create customer: " + insertError);
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
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6 w-full">
        {/* Header & Back Link */}
        <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-5">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Customers Directory
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-sans text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Add New Customer
              </h1>
            </div>
          </div>
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
      </div>
    </AppShell>
  );
}
