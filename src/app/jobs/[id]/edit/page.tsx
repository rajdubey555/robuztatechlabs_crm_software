"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RepairJob, RepairJobFormData, getJobById, updateJob } from "@/modules/jobs";
import { Customer, getCustomers } from "@/modules/customers";
import { Device, getDevices } from "@/modules/devices";
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

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Get user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch job
      const jobRes = await getJobById(id);
      if (jobRes.error || !jobRes.data.job) {
        setError("Failed to load job card: " + (jobRes.error || "Not found"));
        setLoading(false);
        return;
      }

      setJob(jobRes.data.job);

      // Fetch customers & devices for read-only selection reference
      const custRes = await getCustomers();
      setCustomers(custRes.data);

      const devRes = await getDevices();
      setAllDevices(devRes.data);

      setLoading(false);
    }

    loadData();
  }, [id]);

  const handleUpdateJob = async (formData: RepairJobFormData) => {
    if (!id) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await updateJob(id, formData);

      if (res.error) {
        setError("Failed to update job card: " + res.error);
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
