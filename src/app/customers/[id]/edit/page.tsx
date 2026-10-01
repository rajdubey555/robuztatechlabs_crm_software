"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Customer, CustomerFormData } from "@/types/customer";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Alert, LoadingSpinner } from "@/components/ui";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default function EditCustomerPage() {
  const params = useParams();
  const id = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadCustomer() {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch customer
      const { data, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        setError("Failed to load customer: " + fetchError.message);
      } else {
        setCustomer(data);
      }
      setLoading(false);
    }

    loadCustomer();
  }, [id, supabase]);

  const handleUpdateCustomer = async (formData: CustomerFormData) => {
    if (!id) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          alternate_phone: formData.alternate_phone?.trim() || null,
          email: formData.email?.trim() || null,
          address: formData.address?.trim() || null,
          city: formData.city?.trim() || null,
          notes: formData.notes?.trim() || null,
        })
        .eq("id", id);

      if (updateError) {
        setError("Failed to update customer: " + updateError.message);
        setSubmitting(false);
        return;
      }

      // Successful update -> redirect to customer detail page
      router.push(`/customers/${id}`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AppShell userEmail={userEmail}>
        {/* Navigation & Header */}
        <div className="space-y-1">
          <Link
            href={`/customers/${id}`}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            ← Back to Customer Details
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Edit Customer
            </h1>
            {customer && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Customer ID (Read-only):</span>
                <Badge variant="primary" className="font-mono">
                  {customer.customer_code}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" className="text-[#009688]" />
          </div>
        ) : customer ? (
          <CustomerForm
            initialData={{
              full_name: customer.full_name,
              phone: customer.phone,
              alternate_phone: customer.alternate_phone || "",
              email: customer.email || "",
              address: customer.address || "",
              city: customer.city || "",
              notes: customer.notes || "",
            }}
            onSubmit={handleUpdateCustomer}
            isLoading={submitting}
            submitButtonText="Update Customer"
          />
        ) : null}
    </AppShell>
  );
}
