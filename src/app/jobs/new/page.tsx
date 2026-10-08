"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RepairJobFormData } from "@/types/job";
import { Customer } from "@/types/customer";
import { Device } from "@/types/device";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, LoadingSpinner, EmptyState, Button } from "@/components/ui";
import { JobForm } from "@/components/jobs/JobForm";

function NewJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId");
  const preselectedDeviceId = searchParams.get("deviceId");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
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

      // Fetch customers
      const { data: custData, error: custError } = await supabase
        .from("customers")
        .select("*")
        .order("full_name", { ascending: true });

      if (custError) {
        setError("Failed to load customers: " + custError.message);
        setLoading(false);
        return;
      }
      setCustomers(custData || []);

      // Fetch all devices
      const { data: devData, error: devError } = await supabase
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });

      if (devError) {
        setError("Failed to load devices: " + devError.message);
        setLoading(false);
        return;
      }
      setAllDevices(devData || []);

      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const handleCreateJob = async (formData: RepairJobFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      // Security check: Ensure selected device belongs to selected customer
      const targetDevice = allDevices.find((d) => d.id === formData.device_id);
      if (!targetDevice || targetDevice.customer_id !== formData.customer_id) {
        setError("Selected device does not belong to the chosen customer.");
        setSubmitting(false);
        return;
      }

      const estimatedCost =
        formData.estimated_cost !== "" && formData.estimated_cost !== undefined
          ? Number(formData.estimated_cost)
          : null;

      const { data: job, error: insertError } = await supabase
        .from("repair_jobs")
        .insert([
          {
            customer_id: formData.customer_id,
            device_id: formData.device_id,
            branch: formData.branch || "south_bopal",
            category_type: formData.category_type || "laptop_general",
            customer_complaint: formData.customer_complaint.trim(),
            priority: formData.priority,
            status: "received",
            estimated_cost: estimatedCost,
            expected_delivery_at: formData.expected_delivery_at || null,
          },
        ])
        .select()
        .single();

      if (insertError || !job) {
        setError("Failed to create job card: " + (insertError?.message || "Unknown error"));
        setSubmitting(false);
        return;
      }

      // Successful creation -> Redirect to Job Detail page
      router.push(`/jobs/${job.id}`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AppShell userEmail={userEmail}>
        {/* Header */}
        <div className="space-y-1">
          <Link
            href="/jobs"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            ← Back to Repair Jobs
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create Job Card
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Open a new repair job card for customer device complaint intake
          </p>
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
            description="You must create at least one customer and register a device before opening a job card."
            action={
              <Link href="/customers/new">
                <Button variant="primary" size="sm">
                  + Create Customer First
                </Button>
              </Link>
            }
          />
        ) : allDevices.length === 0 ? (
          <EmptyState
            title="No devices registered"
            description="You must register a device for a customer before opening a job card."
            action={
              <Link href="/devices/new">
                <Button variant="primary" size="sm">
                  + Register Device First
                </Button>
              </Link>
            }
          />
        ) : (
          <JobForm
            customers={customers}
            allDevices={allDevices}
            initialData={{
              customer_id: preselectedCustomerId || customers[0]?.id || "",
              device_id: preselectedDeviceId || "",
              customer_complaint: "",
              priority: "medium",
            }}
            onSubmit={handleCreateJob}
            isLoading={submitting}
            submitButtonText="Create Job Card"
          />
        )}
    </AppShell>
  );
}

export default function NewJobPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-[#009688]" />
        </div>
      }
    >
      <NewJobContent />
    </Suspense>
  );
}
