"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RepairJob, JobStatus } from "@/types/job";
import { JobAssignment } from "@/types/employee";
import { Diagnosis } from "@/types/diagnosis";
import { PartRequest } from "@/types/partRequest";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Alert, LoadingSpinner, EmptyState, Modal, Select } from "@/components/ui";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { JobPriorityBadge } from "@/components/jobs/JobPriorityBadge";
import { EmployeeRoleBadge } from "@/components/employees/EmployeeRoleBadge";
import { AssignTechnicianModal } from "@/components/jobs/AssignTechnicianModal";
import { DiagnosisModal } from "@/components/diagnosis/DiagnosisModal";
import { CreatePartRequestModal } from "@/components/partRequests/CreatePartRequestModal";
import { PartRequestList } from "@/components/partRequests/PartRequestList";
import { PartRequestSummaryCard } from "@/components/partRequests/PartRequestSummaryCard";
import { BRANCHES, CATEGORIES } from "@/types/branch";

const VALID_STATUSES: { label: string; value: JobStatus }[] = [
  { label: "Received", value: "received" },
  { label: "Diagnosis Pending", value: "diagnosis_pending" },
  { label: "Diagnosed", value: "diagnosed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Unrepairable", value: "unrepairable" },
];

type ActiveTab = "overview" | "diagnosis" | "technician" | "customer_device" | "part_requests";

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<RepairJob | null>(null);
  const [assignmentsHistory, setAssignmentsHistory] = useState<JobAssignment[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Status Change Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<JobStatus>("received");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assign Technician Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Diagnosis Modal State
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);

  // Part Request Modal State
  const [isPartRequestModalOpen, setIsPartRequestModalOpen] = useState(false);

  const supabase = createClient();

  const loadJob = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch job with customer, device & assigned employee
      const { data, error: fetchError } = await supabase
        .from("repair_jobs")
        .select(`
          *,
          customer:customers (*),
          device:devices (*),
          assigned_employee:employees!repair_jobs_assigned_employee_id_fkey (*)
        `)
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError("Job card not found or error loading data.");
      } else {
        setJob(data);
        setNewStatus(data.status);

        // Fetch assignment history
        const { data: historyData } = await supabase
          .from("job_assignments")
          .select(`
            *,
            employee:employees (*)
          `)
          .eq("repair_job_id", id)
          .order("assigned_at", { ascending: false });

        if (historyData) setAssignmentsHistory(historyData);

        // Fetch diagnosis history
        const { data: diagData } = await supabase
          .from("diagnoses")
          .select(`
            *,
            employee:employees (*)
          `)
          .eq("repair_job_id", id)
          .order("created_at", { ascending: false });

        if (diagData) setDiagnoses(diagData);

        // Fetch part requests
        const { data: partReqData } = await supabase
          .from("part_requests")
          .select(`
            *,
            vendor:vendors(*),
            requested_by_employee:employees!part_requests_requested_by_fkey(*)
          `)
          .eq("repair_job_id", id)
          .order("created_at", { ascending: false });

        if (partReqData) setPartRequests(partReqData as unknown as PartRequest[]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load job details.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleStatusUpdate = async () => {
    if (!job || !id) return;
    setUpdatingStatus(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("repair_jobs")
        .update({
          status: newStatus,
        })
        .eq("id", id);

      if (updateError) {
        setError("Failed to update status: " + updateError.message);
        setUpdatingStatus(false);
        return;
      }

      setJob({ ...job, status: newStatus });
      setIsStatusModalOpen(false);
      setSuccessMessage("Job status updated successfully.");
    } catch {
      setError("An unexpected error occurred while updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return "—";
    return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const latestDiagnosis = diagnoses.length > 0 ? diagnoses[0] : null;
  const isDiagnosed = job?.status === "diagnosed" || Boolean(latestDiagnosis);

  return (
    <AppShell userEmail={userEmail}>
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
        >
          ← Back to Repair Jobs List
        </Link>
        <span className="text-xs text-slate-400 font-mono">Job ID: {id}</span>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" className="text-[#009688]" />
        </div>
      ) : job ? (
        <div className="space-y-6">
          {/* HERO HEADER CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                    {job.job_code}
                  </h1>
                  {job.branch && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${BRANCHES[job.branch]?.badgeColor || ""}`}>
                      📍 {BRANCHES[job.branch]?.name || job.branch}
                    </span>
                  )}
                  {job.category_type && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${CATEGORIES[job.category_type]?.badgeColor || ""}`}>
                      {CATEGORIES[job.category_type]?.icon} {CATEGORIES[job.category_type]?.name || job.category_type}
                    </span>
                  )}
                  <JobStatusBadge status={job.status} />
                  <JobPriorityBadge priority={job.priority} />
                  {isDiagnosed ? (
                    <Badge variant="success">Diagnosed</Badge>
                  ) : (
                    <Badge variant="warning">Pending Diagnosis</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Created on {formatDate(job.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPartRequestModalOpen(true)}
                >
                  🔩 Request Part
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewStatus(job.status);
                    setIsStatusModalOpen(true);
                  }}
                >
                  ⚙️ Change Status
                </Button>
                <Link href={`/jobs/${job.id}/edit`}>
                  <Button variant="primary" size="sm">
                    ✏️ Edit Job Card
                  </Button>
                </Link>
              </div>
            </div>

            {/* TOP QUICK METRICS STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* 1. Customer */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg font-bold">
                  👤
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Customer</span>
                  {job.customer ? (
                    <Link href={`/customers/${job.customer.id}`} className="font-bold text-slate-900 dark:text-white hover:text-[#009688] truncate block text-sm">
                      {job.customer.full_name}
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </div>
              </div>

              {/* 2. Device */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg font-bold">
                  💻
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Device</span>
                  {job.device ? (
                    <Link href={`/devices/${job.device.id}`} className="font-bold text-slate-900 dark:text-white hover:text-[#009688] truncate block text-sm">
                      {job.device.brand} {job.device.model}
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </div>
              </div>

              {/* 3. Assigned Technician */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold">
                  🛠️
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Technician</span>
                  {job.assigned_employee ? (
                    <Link href={`/employees/${job.assigned_employee.id}`} className="font-bold text-slate-900 dark:text-white hover:text-[#009688] truncate block text-sm">
                      {job.assigned_employee.full_name}
                    </Link>
                  ) : (
                    <button onClick={() => setIsAssignModalOpen(true)} className="text-xs text-amber-600 font-bold hover:underline block">
                      + Assign Tech
                    </button>
                  )}
                </div>
              </div>

              {/* 4. Est. Cost */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#009688]/10 text-[#009688] flex items-center justify-center text-lg font-bold">
                  💰
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Estimated Cost</span>
                  <span className="text-lg font-black text-[#009688] block">
                    {formatCurrency(job.estimated_cost)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION BAR */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "overview"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900 shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>📋</span> Job Overview & Complaint
            </button>

            <button
              onClick={() => setActiveTab("diagnosis")}
              className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "diagnosis"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900 shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>🔬</span> Technical Diagnosis ({diagnoses.length})
            </button>

            <button
              onClick={() => setActiveTab("part_requests")}
              className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "part_requests"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900 shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>🔩</span> Part Requests ({partRequests.length})
            </button>

            <button
              onClick={() => setActiveTab("technician")}
              className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "technician"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900 shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>👨‍🔧</span> Technician Assignment ({assignmentsHistory.length})
            </button>

            <button
              onClick={() => setActiveTab("customer_device")}
              className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "customer_device"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900 shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>👤</span> Customer & Device Specs
            </button>
          </div>

          {/* TAB CONTENT PANELS */}

          {/* TAB 1: OVERVIEW & COMPLAINT */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Complaint Card */}
                <Card className="shadow-xs">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">📢</span> Reported Customer Complaint
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Received: {formatDate(job.received_at)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <p className="text-base font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {job.customer_complaint}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial & Costing Card */}
                <Card className="shadow-xs">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span className="text-lg">💳</span> Costing & Estimates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-semibold block uppercase">Estimated Repair Cost</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                          {formatCurrency(job.estimated_cost)}
                        </span>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-semibold block uppercase">Final Bill Cost</span>
                        <span className="text-2xl font-black text-[#009688] dark:text-[#80cbc4] mt-1 block">
                          {formatCurrency(job.final_cost)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Summary Side */}
              <div className="space-y-6">
                {/* Part Requests Summary Widget */}
                <PartRequestSummaryCard
                  requests={partRequests}
                  onRequestNew={() => setIsPartRequestModalOpen(true)}
                />

                <Card className="shadow-xs border-l-4 border-l-[#009688]">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-base font-bold">Quick Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 uppercase font-semibold block">Workflow Status</span>
                      <div className="mt-1">
                        <JobStatusBadge status={job.status} />
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 uppercase font-semibold block">Priority Level</span>
                      <div className="mt-1">
                        <JobPriorityBadge priority={job.priority} />
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 uppercase font-semibold block">Diagnosis Status</span>
                      <div className="mt-1">
                        {isDiagnosed ? (
                          <Badge variant="success">Diagnosed</Badge>
                        ) : (
                          <Badge variant="warning">Pending Diagnosis</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL DIAGNOSIS */}
          {activeTab === "diagnosis" && (
            <div className="space-y-6">
              <Card className="shadow-xs border-2 border-[#009688]/30">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <span>🔬</span> Technical Diagnosis & Assessment
                  </CardTitle>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsDiagnosisModalOpen(true)}
                  >
                    {latestDiagnosis ? "+ Add New / Update Diagnosis" : "+ Record Diagnosis"}
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  {latestDiagnosis ? (
                    <div className="space-y-4">
                      {/* Latest Active Diagnosis Banner Card */}
                      <div className="rounded-xl bg-[#009688]/5 p-5 border border-[#009688]/30 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="success">Latest Diagnosis Findings</Badge>
                            {latestDiagnosis.employee && (
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                By {latestDiagnosis.employee.full_name} ({latestDiagnosis.employee.employee_code})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {formatDate(latestDiagnosis.created_at)}
                          </span>
                        </div>

                        <div>
                          <span className="text-xs font-bold text-[#009688] uppercase tracking-wider block">Diagnosis Findings</span>
                          <p className="text-base font-semibold text-slate-900 dark:text-white mt-1 whitespace-pre-wrap leading-relaxed">
                            {latestDiagnosis.diagnosis}
                          </p>
                        </div>

                        {latestDiagnosis.recommended_action && (
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase block">Recommended Action / Repair Solution</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                              {latestDiagnosis.recommended_action}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800">
                          <div>
                            <span className="text-xs text-slate-500 font-semibold uppercase block">Estimated Repair Cost</span>
                            <span className="text-xl font-black text-[#009688]">
                              {formatCurrency(latestDiagnosis.estimated_cost)}
                            </span>
                          </div>

                          {latestDiagnosis.notes && (
                            <div className="text-right">
                              <span className="text-xs text-slate-500 font-semibold uppercase block">Technical Notes</span>
                              <span className="text-xs text-slate-600 dark:text-slate-400 italic">
                                {latestDiagnosis.notes}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Historical Diagnosis Log */}
                      {diagnoses.length > 1 && (
                        <div className="pt-4 space-y-3">
                          <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                            Diagnosis History Audit Log ({diagnoses.length})
                          </h4>
                          <div className="space-y-2">
                            {diagnoses.map((diag, index) => {
                              const revIndex = diagnoses.length - index;
                              const isLatest = index === 0;

                              return (
                                <div
                                  key={diag.id}
                                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                                    isLatest
                                      ? "border-[#009688]/30 bg-white dark:bg-slate-900"
                                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                                        Diagnosis Record #{revIndex}
                                      </span>
                                      {diag.employee && (
                                        <span className="text-slate-500">
                                          • {diag.employee.full_name}
                                        </span>
                                      )}
                                      {isLatest && <Badge variant="primary" className="text-[10px]">Active Latest</Badge>}
                                    </div>
                                    <span className="text-slate-400 font-mono">
                                      {formatDate(diag.created_at)}
                                    </span>
                                  </div>

                                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                                    {diag.diagnosis}
                                  </p>

                                  <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span>Action: {diag.recommended_action || "—"}</span>
                                    <span className="font-bold text-[#009688]">
                                      Est: {formatCurrency(diag.estimated_cost)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50/60 p-6 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-amber-900 dark:text-amber-200 text-base">
                          No diagnosis recorded yet.
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                          Assigned technician should inspect device and record diagnostic assessment.
                        </p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setIsDiagnosisModalOpen(true)}>
                        + Add Diagnosis
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: PART REQUESTS */}
          {activeTab === "part_requests" && (
            <div className="space-y-6">
              <Card className="shadow-xs border-2 border-[#009688]/30">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <span>🔩</span> Spare Part Procurement Requests
                  </CardTitle>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPartRequestModalOpen(true)}
                  >
                    + Request Spare Part
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  <PartRequestList
                    requests={partRequests}
                    repairJob={job}
                    onRefresh={loadJob}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: TECHNICIAN & ASSIGNMENT */}
          {activeTab === "technician" && (
            <div className="space-y-6">
              <Card className="shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <span>👨‍🔧</span> Current Technician & Work History
                  </CardTitle>
                  <Button
                    variant={job.assigned_employee ? "outline" : "primary"}
                    size="sm"
                    onClick={() => setIsAssignModalOpen(true)}
                  >
                    {job.assigned_employee ? "Reassign Technician" : "Assign Technician"}
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                  {job.assigned_employee ? (
                    <div className="rounded-xl bg-emerald-50/60 p-5 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Current Assigned Staff</span>
                          <Badge variant="success">Active Assignment</Badge>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            href={`/employees/${job.assigned_employee.id}`}
                            className="font-extrabold text-slate-900 dark:text-white text-lg hover:text-[#009688] hover:underline"
                          >
                            {job.assigned_employee.full_name}
                          </Link>
                          <Badge variant="primary">{job.assigned_employee.employee_code}</Badge>
                          <EmployeeRoleBadge role={job.assigned_employee.role} />
                        </div>
                        <p className="text-xs text-slate-500 capitalize">
                          Specialization: {job.assigned_employee.specialization || "General"}
                        </p>
                      </div>

                      <Link href={`/employees/${job.assigned_employee.id}`}>
                        <Button variant="ghost" size="sm">
                          View Employee Profile →
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50/60 p-6 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-amber-900 dark:text-amber-200 text-base">Unassigned Job</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                          No technician is currently assigned to work on this repair job.
                        </p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setIsAssignModalOpen(true)}>
                        Assign Now
                      </Button>
                    </div>
                  )}

                  {/* Assignment History Log */}
                  {assignmentsHistory.length > 0 && (
                    <div className="pt-2 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Assignment Audit Log ({assignmentsHistory.length})
                      </h4>
                      <div className="space-y-2">
                        {assignmentsHistory.map((hist, idx) => (
                          <div
                            key={hist.id || idx}
                            className="flex items-start justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  {hist.employee?.full_name || "Technician"}
                                </span>
                                {hist.employee && <EmployeeRoleBadge role={hist.employee.role} />}
                                {!hist.unassigned_at ? (
                                  <Badge variant="success">Current Active</Badge>
                                ) : (
                                  <Badge variant="default">Reassigned</Badge>
                                )}
                              </div>
                              {hist.notes && (
                                <p className="text-slate-600 dark:text-slate-400 italic mt-1">
                                  Note: {hist.notes}
                                </p>
                              )}
                            </div>

                            <div className="text-right text-slate-400 font-mono">
                              <div>Assigned: {formatDate(hist.assigned_at)}</div>
                              {hist.unassigned_at && <div>Unassigned: {formatDate(hist.unassigned_at)}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: CUSTOMER & DEVICE SPECS */}
          {activeTab === "customer_device" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Card */}
              <Card className="shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <span>👤</span> Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-sm">
                  {job.customer ? (
                    <>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold block uppercase">Full Name</span>
                        <Link
                          href={`/customers/${job.customer.id}`}
                          className="font-bold text-[#009688] hover:underline text-lg block mt-0.5"
                        >
                          {job.customer.full_name}
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-semibold uppercase">Customer ID</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{job.customer.customer_code}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold uppercase">Phone Number</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{job.customer.phone}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link href={`/customers/${job.customer.id}`}>
                          <Button variant="outline" size="sm" fullWidth>
                            View Customer Profile & History →
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400 text-xs">Customer info unavailable.</p>
                  )}
                </CardContent>
              </Card>

              {/* Device Card */}
              <Card className="shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <span>💻</span> Device Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-sm">
                  {job.device ? (
                    <>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold block uppercase">Brand & Model</span>
                        <Link
                          href={`/devices/${job.device.id}`}
                          className="font-bold text-slate-900 hover:text-[#009688] dark:text-white text-lg block mt-0.5"
                        >
                          {job.device.brand} {job.device.model}
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-semibold uppercase">Device Code</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{job.device.device_code}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold uppercase">Device Type</span>
                          <Badge variant="default" className="text-xs capitalize">{job.device.device_type}</Badge>
                        </div>
                      </div>

                      {(job.device.serial_number || job.device.imei) && (
                        <div className="text-xs">
                          <span className="text-slate-400 block font-semibold uppercase">Serial Number / IMEI</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{job.device.serial_number || job.device.imei}</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link href={`/devices/${job.device.id}`}>
                          <Button variant="outline" size="sm" fullWidth>
                            View Device Details →
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400 text-xs">Device info unavailable.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="Job Card Not Found"
          description="The requested repair job card does not exist."
          action={
            <Link href="/jobs">
              <Button variant="primary" size="sm">
                Return to Jobs List
              </Button>
            </Link>
          }
        />
      )}

      {/* Change Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Change Job Status"
        description="Update the current workflow status of this repair job card."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusUpdate}
              isLoading={updatingStatus}
            >
              Update Status
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <Select
            label="Select New Status"
            options={VALID_STATUSES}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as JobStatus)}
          />
        </div>
      </Modal>

      {/* Assign / Reassign Technician Modal */}
      {job && (
        <AssignTechnicianModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          jobId={job.id}
          currentAssignedId={job.assigned_employee_id}
          onAssigned={() => {
            setSuccessMessage("Technician assignment updated successfully.");
            loadJob();
          }}
        />
      )}

      {/* Diagnosis Modal */}
      {job && (
        <DiagnosisModal
          isOpen={isDiagnosisModalOpen}
          onClose={() => setIsDiagnosisModalOpen(false)}
          jobId={job.id}
          assignedEmployeeId={job.assigned_employee_id}
          latestDiagnosis={latestDiagnosis}
          customerComplaint={job.customer_complaint}
          onSaved={() => {
            setSuccessMessage("Diagnosis recorded and job status updated to Diagnosed.");
            loadJob();
          }}
        />
      )}

      {/* Create Part Request Modal */}
      {job && (
        <CreatePartRequestModal
          isOpen={isPartRequestModalOpen}
          onClose={() => setIsPartRequestModalOpen(false)}
          repairJob={job}
          onSuccess={() => {
            setSuccessMessage("Spare part procurement request created successfully.");
            loadJob();
          }}
        />
      )}
    </AppShell>
  );
}
