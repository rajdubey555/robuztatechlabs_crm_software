"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Customer, CustomerFormData, getCustomerById, updateCustomer, CustomerForm } from "@/modules/customers";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Alert, LoadingSpinner } from "@/components/ui";
import { ArrowLeft, Pencil } from "lucide-react";

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

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserEmail(user.email);

        const { data, error: fetchError } = await getCustomerById(id);

        if (fetchError || !data) {
          setError(fetchError || "Failed to load customer profile.");
        } else {
          setCustomer(data);
        }
      } catch (err: unknown) {
        setError("An unexpected error occurred while loading customer details.");
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [id, supabase]);

  const handleUpdateCustomer = async (formData: CustomerFormData) => {
    if (!id) return;
    setSubmitting(true);
    setError(null);

    const { success, error: updateError } = await updateCustomer(id, formData);

    if (!success || updateError) {
      setError(updateError || "Failed to update customer.");
      setSubmitting(false);
      return;
    }

    // Successful update -> redirect to customer detail page
    router.push(`/customers/${id}`);
    router.refresh();
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6 w-full">
        {/* Navigation & Header */}
        <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-5">
          <Link
            href={`/customers/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Customer Details
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688]">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-sans text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Edit Customer
                </h1>
                {customer && (
                  <Badge variant="primary" className="font-mono text-xs">
                    {customer.customer_code}
                  </Badge>
                )}
              </div>
            </div>
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
              state: customer.state || "Gujarat",
              city: customer.city || "",
              branch: customer.branch || "south_bopal",
              notes: customer.notes || "",
            }}
            onSubmit={handleUpdateCustomer}
            isLoading={submitting}
            submitButtonText="Update Customer Profile"
          />
        ) : null}
      </div>
    </AppShell>
  );
}
