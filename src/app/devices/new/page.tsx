"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DeviceFormData, createDevice, DeviceForm } from "@/modules/devices";
import { Customer, getCustomers } from "@/modules/customers";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, LoadingSpinner, EmptyState, Button } from "@/components/ui";
import { ArrowLeft, Laptop } from "lucide-react";

function NewDeviceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch customers via customerService
      const { data, error: fetchError } = await getCustomers();

      if (fetchError) {
        setError("Failed to load customers: " + fetchError);
      } else {
        setCustomers(data);
      }
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const handleCreateDevice = async (formData: DeviceFormData, photos: File[]) => {
    setSubmitting(true);
    setError(null);

    const { data: device, error: insertError } = await createDevice(formData, photos);

    if (insertError || !device) {
      setError(insertError || "Failed to register device.");
      setSubmitting(false);
      return;
    }

    // Redirect to Device Detail page
    router.push(`/devices/${device.id}`);
    router.refresh();
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <Link
            href="/devices"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Devices Directory
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688]">
              <Laptop className="w-4 h-4" />
            </div>
            <h1 className="font-sans text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Register New Device
            </h1>
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
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="You must create at least one customer before registering a device."
            action={
              <Link href="/customers/new">
                <Button variant="primary" size="sm">
                  + Create Customer First
                </Button>
              </Link>
            }
          />
        ) : (
          <DeviceForm
            customers={customers}
            initialData={{
              customer_id: preselectedCustomerId || customers[0]?.id || "",
              device_type: "Laptop",
              brand: "",
              model: "",
            }}
            onSubmit={handleCreateDevice}
            isLoading={submitting}
            submitButtonText="Register Device"
          />
        )}
      </div>
    </AppShell>
  );
}

export default function NewDevicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-[#009688]" />
        </div>
      }
    >
      <NewDeviceContent />
    </Suspense>
  );
}
