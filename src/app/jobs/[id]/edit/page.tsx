"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RepairJob, RepairJobFormData } from "@/types/job";
import { Customer } from "@/types/customer";
import { Device } from "@/types/device";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Alert, LoadingSpinner } from "@/components/ui";
import { JobForm } from "@/components/jobs/JobForm";

export default function EditJobPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<RepairJob | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch job
      const { data: jobData, error: jobError } = await supabase
        .from("repair_jobs")
        .select(`
          *,
          customer:customers (*),
          device:devices (*)
        `)
        .eq("id", id)
        .single();

      if (jobError || !jobData) {
        setError("Failed to load job card: " + (jobError?.message || "Not found"));
        setLoading(false);
        return;
      }

      setJob(jobData);

      // Fetch customers & devices for read-only selection reference
      const { data: custData } = await supabase.from("customers").select("*");
      setCustomers(custData || []);

      const { data: devData } = await supabase.from("devices").select("*");
      setAllDevices(devData || []);

      setLoading(false);
    }

    loadData();
  }, [id, supabase]);

  const handleUpdateJob = async (formData: RepairJobFormData) => {
    if (!id) return;
    setSubmitting(true);
    setError(null);

    try {
      const estimatedCost =
        formData.estimated_cost !== "" && formData.estimated_cost !== undefined
          ? Number(formData.estimated_cost)
          : null;

      const finalCost =
        formData.final_cost !== "" && formData.final_cost !== undefined
          ? Number(formData.final_cost)
          : null;

      const { error: updateError } = await supabase
        .from("repair_jobs")
        .update({
          customer_complaint: formData.customer_complaint.trim(),
          priority: formData.priority,
          estimated_cost: estimatedCost,
          final_cost: finalCost,
          expected_delivery_at: formData.expected_delivery_at || null,
        })
        .eq("id", id);

      if (updateError) {
        setError("Failed to update job card: " + updateError.message);
        setSubmitting(false);
        return;
      }

      router.push(`/jobs/${id}`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AppShell userEmail={userEmail}>
        <div className="space-y-1">
          <Link
            href={`/jobs/${id}`}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            ← Back to Job Details
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Edit Job Card
            </h1>
            {job && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Job ID (Read-only):</span>
                <Badge variant="primary" className="font-mono">
                  {job.job_code}
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
        ) : job ? (
          <JobForm
            isEdit
            customers={customers.length > 0 ? customers : (job.customer ? [job.customer as unknown as Customer] : [])}
            allDevices={allDevices.length > 0 ? allDevices : (job.device ? [job.device as unknown as Device] : [])}
            initialData={{
              customer_id: job.customer_id,
              device_id: job.device_id,
              customer_complaint: job.customer_complaint,
              priority: job.priority,
              estimated_cost: job.estimated_cost ?? "",
              final_cost: job.final_cost ?? "",
              expected_delivery_at: job.expected_delivery_at || "",
            }}
            onSubmit={handleUpdateJob}
            isLoading={submitting}
            submitButtonText="Update Job Card"
          />
        ) : null}
    </AppShell>
  );
}
