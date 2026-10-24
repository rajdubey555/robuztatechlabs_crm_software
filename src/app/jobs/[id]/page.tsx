"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RepairJob, JobStatus, getJobById, updateJobStatus, deleteJob } from "@/modules/jobs";
import { usePermissions } from "@/context/PermissionContext";
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
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  Pencil,
  User,
  Laptop,
  Wrench,
  Coins,
  Plane,
  FileText,
  Microscope,
  History,
  Plus,
  MessageCircle,
  Mail,
  Send,
  Eye,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  buildCustomerQuotationWhatsAppMessage,
  buildCustomerQuotationEmail,
  buildWhatsAppClickUrl,
} from "@/services/whatsappService";

const VALID_STATUSES: { label: string; value: JobStatus }[] = [
  { label: "Received", value: "received" },
  { label: "In Diagnosis", value: "diagnosis_pending" },
  { label: "Diagnosed", value: "diagnosed" },
  { label: "Waiting for Parts", value: "waiting_parts" },
  { label: "Under Repair", value: "in_progress" },
  { label: "Ready for Pickup", value: "ready_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Unrepairable", value: "unrepairable" },
];

type ActiveTab = "overview" | "diagnosis" | "technician" | "customer_device" | "part_requests";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isAdmin, hasPermission } = usePermissions();
  const canDeleteJob = isAdmin || hasPermission("jobs.delete");

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
  const [finalCostInput, setFinalCostInput] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assign Technician Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Diagnosis Modal State
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);

  // Part Request Modal State
  const [isPartRequestModalOpen, setIsPartRequestModalOpen] = useState(false);

  // Customer Quotation Preview Modal State
  const [isQuotationPreviewModalOpen, setIsQuotationPreviewModalOpen] = useState(false);
  const [quotationTab, setQuotationTab] = useState<"whatsapp" | "email">("whatsapp");
  const [copiedType, setCopiedType] = useState<"wa" | "email" | null>(null);

  // Delete Job Modal State (Admin only)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingJob, setDeletingJob] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      const res = await getJobById(id);
      if (res.error || !res.data.job) {
        setError(res.error || "Job card not found or error loading data.");
      } else {
        setJob(res.data.job);
        setNewStatus(res.data.job.status);
        setFinalCostInput(res.data.job.final_cost ? String(res.data.job.final_cost) : (res.data.job.estimated_cost ? String(res.data.job.estimated_cost) : ""));
        setAssignmentsHistory(res.data.assignmentsHistory);
        setDiagnoses(res.data.diagnoses);
        setPartRequests(res.data.partRequests);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load job details.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleStatusUpdate = async () => {
    if (!job || !id) return;
    setUpdatingStatus(true);
    setError(null);

    try {
      const finalCost = finalCostInput ? parseFloat(finalCostInput) : null;
      const res = await updateJobStatus(id, newStatus, finalCost);

      if (res.error) {
        setError("Failed to update status: " + res.error);
        setUpdatingStatus(false);
        return;
      }

      setIsStatusModalOpen(false);
      setSuccessMessage("Job status updated successfully to " + (VALID_STATUSES.find(s => s.value === newStatus)?.label || newStatus));
      loadJob();
    } catch {
      setError("An unexpected error occurred while updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleQuickStatusChange = async (targetStatus: JobStatus, successNote: string) => {
    if (!job || !id) return;
    setUpdatingStatus(true);
    setError(null);
    try {
      const res = await updateJobStatus(id, targetStatus);
      if (res.error) {
        setError("Failed to update status: " + res.error);
      } else {
        setSuccessMessage(successNote);
        loadJob();
      }
    } catch {
      setError("An unexpected error occurred while updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getCustomerQuotationTexts = () => {
    if (!job || !latestDiagnosis) return null;
    const customerName = job.customer?.full_name || "Valued Customer";
    const branchName = job.branch ? (BRANCHES[job.branch]?.name || job.branch) : undefined;

    const whatsappMessage = buildCustomerQuotationWhatsAppMessage({
      customer_name: customerName,
      job_code: job.job_code,
      device_brand: job.device?.brand,
      device_model: job.device?.model,
      diagnosis: latestDiagnosis.diagnosis,
      recommended_action: latestDiagnosis.recommended_action,
      estimated_cost: latestDiagnosis.estimated_cost,
      branch_name: branchName,
      notes: latestDiagnosis.notes,
    });

    const emailData = buildCustomerQuotationEmail({
      customer_email: job.customer?.email,
      customer_name: customerName,
      job_code: job.job_code,
      device_brand: job.device?.brand,
      device_model: job.device?.model,
      diagnosis: latestDiagnosis.diagnosis,
      recommended_action: latestDiagnosis.recommended_action,
      estimated_cost: latestDiagnosis.estimated_cost,
      branch_name: branchName,
      notes: latestDiagnosis.notes,
    });

    const phone = job.customer?.phone || job.customer?.alternate_phone || "";
    const whatsappUrl = phone ? buildWhatsAppClickUrl(phone, whatsappMessage) : "";

    return {
      whatsappMessage,
      whatsappUrl,
      emailSubject: emailData.subject,
      emailBody: emailData.body,
      mailtoUrl: emailData.mailtoUrl,
      customerPhone: phone,
      customerEmail: job.customer?.email || "",
    };
  };

  const handleSendWhatsAppEstimate = () => {
    const qData = getCustomerQuotationTexts();
    if (!qData) return;

    if (!qData.customerPhone) {
      setError("Customer contact number is missing. Please edit customer profile first.");
      return;
    }

    window.open(qData.whatsappUrl, "_blank", "noopener,noreferrer");
    setSuccessMessage(`WhatsApp quotation window opened for ${job?.customer?.full_name} (${qData.customerPhone})`);
  };

  const handleSendEmailEstimate = () => {
    const qData = getCustomerQuotationTexts();
    if (!qData) return;

    if (!qData.customerEmail) {
      setIsQuotationPreviewModalOpen(true);
      setQuotationTab("email");
      setError("Customer does not have an email address on file. You can copy the message or send via WhatsApp.");
      return;
    }

    window.location.href = qData.mailtoUrl;
    setSuccessMessage(`Email draft opened for ${qData.customerEmail}`);
  };

  const handleCopyQuotation = (text: string, type: "wa" | "email") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDeleteJob = async () => {
    if (!job || !id) return;
    setDeletingJob(true);
    setDeleteError(null);
    try {
      const res = await deleteJob(id);
      if (res.error) {
        setDeleteError(res.error);
        setDeletingJob(false);
      } else {
        router.push("/jobs");
      }
    } catch {
      setDeleteError("An unexpected error occurred while deleting the job.");
      setDeletingJob(false);
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
      <div className="flex items-center justify-between pb-1">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Repair Jobs Directory
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
        <div className="flex flex-col justify-center items-center py-24 space-y-3">
          <LoadingSpinner size="lg" className="text-[#009688]" />
          <p className="text-xs text-slate-400">Loading job details...</p>
        </div>
      ) : job ? (
        <div className="space-y-6">
          {/* TOP EXECUTIVE HEADER */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                    {job.job_code}
                  </h1>

                  {job.branch && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {BRANCHES[job.branch]?.shortName || job.branch}
                    </span>
                  )}

                  {job.category_type && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {job.category_type === "drone" ? (
                        <Plane className="w-3 h-3 text-[#009688]" />
                      ) : (
                        <Laptop className="w-3 h-3 text-[#009688]" />
                      )}
                      {CATEGORIES[job.category_type]?.name || job.category_type}
                    </span>
                  )}

                  <JobStatusBadge status={job.status} />
                  <JobPriorityBadge priority={job.priority} />
                </div>

                <p className="text-xs text-slate-400">
                  Received on {formatDate(job.received_at || job.created_at)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPartRequestModalOpen(true)}
                  className="h-8.5 text-xs font-medium"
                >
                  <Package className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Request Part
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewStatus(job.status);
                    setIsStatusModalOpen(true);
                  }}
                  className="h-8.5 text-xs font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Change Status
                </Button>

                <Link href={`/jobs/${job.id}/edit`}>
                  <Button variant="primary" size="sm" className="h-8.5 text-xs font-medium">
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit Job
                  </Button>
                </Link>

                {canDeleteJob && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="h-8.5 text-xs font-semibold text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900 dark:hover:bg-rose-950/40"
                    title="Admin: Delete repair job ticket"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                    Delete Job
                  </Button>
                )}
              </div>
            </div>

            {/* TOP 4 QUICK METRICS STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* 1. Customer */}
              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="overflow-hidden space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Customer
                  </span>
                  {job.customer ? (
                    <Link
                      href={`/customers/${job.customer.id}`}
                      className="font-semibold text-slate-900 dark:text-white hover:text-[#009688] truncate block text-sm transition-colors"
                    >
                      {job.customer.full_name}
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                  {job.customer?.phone && (
                    <span className="text-xs text-slate-500 block font-mono">
                      {job.customer.phone}
                    </span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#009688]" />
                </div>
              </div>

              {/* 2. Device */}
              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="overflow-hidden space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Device
                  </span>
                  {job.device ? (
                    <Link
                      href={`/devices/${job.device.id}`}
                      className="font-semibold text-slate-900 dark:text-white hover:text-[#009688] truncate block text-sm transition-colors"
                    >
                      {job.device.brand} {job.device.model}
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                  {job.device?.device_code && (
                    <span className="text-xs text-slate-500 block font-mono">
                      {job.device.device_code}
                    </span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4 text-[#009688]" />
                </div>
              </div>

              {/* 3. Assigned Technician */}
              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="overflow-hidden space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Technician
                  </span>
                  {job.assigned_employee ? (
                    <Link
                      href={`/employees/${job.assigned_employee.id}`}
                      className="font-semibold text-slate-900 dark:text-white hover:text-[#009688] truncate block text-sm transition-colors"
                    >
                      {job.assigned_employee.full_name}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(true)}
                      className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline block"
                    >
                      + Assign Technician
                    </button>
                  )}
                  {job.assigned_employee?.employee_code && (
                    <span className="text-xs text-slate-500 block font-mono">
                      {job.assigned_employee.employee_code}
                    </span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-[#009688]" />
                </div>
              </div>

              {/* 4. Est. Cost */}
              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Estimated Cost
                  </span>
                  <span className="text-lg font-bold font-sans text-slate-900 dark:text-white block">
                    {formatCurrency(job.estimated_cost)}
                  </span>
                  {job.final_cost ? (
                    <span className="text-xs text-[#009688] font-semibold block">
                      Final: {formatCurrency(job.final_cost)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 block">Not billed yet</span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION BAR (PURE MINIMAL LUCIDE ICONS, ZERO EMOJIS) */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Overview & Complaint
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("diagnosis")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === "diagnosis"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              Technical Diagnosis ({diagnoses.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("part_requests")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === "part_requests"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Part Requests ({partRequests.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("technician")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === "technician"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Technician Log ({assignmentsHistory.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("customer_device")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeTab === "customer_device"
                  ? "border-[#009688] text-[#009688] bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Customer & Device Specs
            </button>
          </div>

          {/* TAB CONTENT PANELS */}

          {/* TAB 1: OVERVIEW & COMPLAINT */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* ACTION BANNER: CUSTOMER ESTIMATE & APPROVAL READY */}
                {latestDiagnosis && (job.status === "diagnosed" || job.status === "diagnosis_pending") && (
                  <div className="rounded-xl border border-teal-300/80 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-white dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-slate-900 p-4.5 shadow-2xs dark:border-teal-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#009688] text-white shadow-xs">
                            <Send className="w-3 h-3" />
                            Diagnosis Complete
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Estimate: <span className="text-[#009688] font-bold">{formatCurrency(latestDiagnosis.estimated_cost)}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Send quotation directly to customer via WhatsApp or Email. No phone call needed.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={handleSendWhatsAppEstimate}
                          className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                          Send WhatsApp
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSendEmailEstimate}
                          className="h-8 text-xs font-semibold text-sky-700 bg-sky-50 border-sky-300 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                        >
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-sky-600 dark:text-sky-400" />
                          Send Email
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsQuotationPreviewModalOpen(true)}
                          className="h-8 text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          Preview
                        </Button>
                      </div>
                    </div>

                    {/* 1-Click Customer Approval Buttons */}
                    <div className="pt-2.5 border-t border-teal-200/60 dark:border-teal-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                        Customer Decision:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          disabled={updatingStatus}
                          onClick={() => handleQuickStatusChange("in_progress", "Customer approved! Job moved to Under Repair.")}
                          className="h-7.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Customer Approved (Start Repair)
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingStatus}
                          onClick={() => handleQuickStatusChange("waiting_parts", "Job moved to Waiting for Parts.")}
                          className="h-7.5 text-xs font-medium text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                        >
                          <Package className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Need Parts First
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingStatus}
                          onClick={() => handleQuickStatusChange("cancelled", "Job marked as Cancelled / Customer Declined.")}
                          className="h-7.5 text-xs font-medium text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          Customer Declined
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Complaint Card */}
                <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between text-slate-900 dark:text-white">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#009688]" />
                        Reported Customer Complaint
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-normal">
                        Received: {formatDate(job.received_at)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <div className="rounded-lg bg-slate-50/80 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {job.customer_complaint}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial & Costing Card */}
                <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                      <Coins className="w-4 h-4 text-[#009688]" />
                      Costing & Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-slate-50/80 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium block">
                          Estimated Repair Cost
                        </span>
                        <span className="text-xl font-bold font-sans text-slate-900 dark:text-white mt-1 block">
                          {formatCurrency(job.estimated_cost)}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50/80 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium block">
                          Final Billed Cost
                        </span>
                        <span className="text-xl font-bold font-sans text-[#009688] mt-1 block">
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

                <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                      Job Status Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Workflow Status</span>
                      <JobStatusBadge status={job.status} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Priority Level</span>
                      <JobPriorityBadge priority={job.priority} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Technical Diagnosis</span>
                      {isDiagnosed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Pending
                        </span>
                      )}
                    </div>

                    {job.completed_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Repair Completed</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                          {formatDate(job.completed_at)}
                        </span>
                      </div>
                    )}

                    {job.delivered_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Delivered Date</span>
                        <span className="font-mono text-[#009688] font-semibold text-xs">
                          {formatDate(job.delivered_at)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL DIAGNOSIS */}
          {activeTab === "diagnosis" && (
            <div className="space-y-6">
              <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Microscope className="w-4 h-4 text-[#009688]" />
                    Technical Diagnosis & Assessment
                  </CardTitle>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsDiagnosisModalOpen(true)}
                    className="h-8 text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {latestDiagnosis ? "Update Diagnosis" : "Record Diagnosis"}
                  </Button>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  {latestDiagnosis ? (
                    <div className="space-y-4">
                      {/* Latest Active Diagnosis Banner Card */}
                      <div className="rounded-xl bg-slate-50/70 p-4 sm:p-5 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Latest Findings
                            </span>
                            {latestDiagnosis.employee && (
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                by {latestDiagnosis.employee.full_name} ({latestDiagnosis.employee.employee_code})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {formatDate(latestDiagnosis.created_at)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Diagnostic Assessment
                          </span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 whitespace-pre-wrap leading-relaxed">
                            {latestDiagnosis.diagnosis}
                          </p>
                        </div>

                        {latestDiagnosis.recommended_action && (
                          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Recommended Solution
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                              {latestDiagnosis.recommended_action}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Estimated Repair Cost
                            </span>
                            <span className="text-lg font-bold font-sans text-[#009688]">
                              {formatCurrency(latestDiagnosis.estimated_cost)}
                            </span>
                          </div>

                          {latestDiagnosis.notes && (
                            <div className="text-right max-w-xs">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Technical Notes
                              </span>
                              <span className="text-xs text-slate-500 italic block">
                                {latestDiagnosis.notes}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* DEDICATED CUSTOMER ESTIMATE & DIGITAL APPROVAL STATION */}
                      <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/60 via-emerald-50/30 to-white dark:from-teal-950/30 dark:via-emerald-950/10 dark:to-slate-900 p-4.5 sm:p-5 dark:border-teal-900/60 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-[#009688]/10 text-[#009688] dark:bg-[#009688]/20">
                                <Send className="w-4 h-4" />
                              </span>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Customer Quotation & Digital Approval Hub
                              </h3>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Send pre-formatted diagnosis & cost estimate directly to customer via WhatsApp or Email. No phone call needed.
                            </p>
                          </div>

                          {/* Quick contact pills */}
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            {job.customer?.phone && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                {job.customer.phone}
                              </span>
                            )}
                            {job.customer?.email ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                                <Mail className="w-3 h-3 text-sky-600" />
                                {job.customer.email}
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                (No customer email on file)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dispatch Actions Toolbar */}
                        <div className="flex items-center gap-2.5 flex-wrap pt-1">
                          <Button
                            size="sm"
                            onClick={handleSendWhatsAppEstimate}
                            className="h-8.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Send Estimate via WhatsApp
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSendEmailEstimate}
                            className="h-8.5 text-xs font-semibold text-sky-700 bg-sky-50 border-sky-300 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                          >
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-sky-600 dark:text-sky-400" />
                            Send Estimate via Email
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsQuotationPreviewModalOpen(true);
                              setQuotationTab("whatsapp");
                            }}
                            className="h-8.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                            Preview & Copy Text
                          </Button>
                        </div>

                        {/* Customer Decision Actions Bar */}
                        <div className="pt-3 border-t border-teal-200/60 dark:border-teal-900/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Customer Response & Approval Status:
                            </span>
                            <JobStatusBadge status={job.status} />
                          </div>

                          {job.status === "diagnosed" || job.status === "diagnosis_pending" ? (
                            <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-teal-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                Once customer replies on WhatsApp or Email, record response:
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  disabled={updatingStatus}
                                  onClick={() => handleQuickStatusChange("in_progress", "Customer approved! Job moved to Under Repair.")}
                                  className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Customer Approved (Start Repair)
                                </Button>

                                <Button
                                  size="sm"
                                  disabled={updatingStatus}
                                  onClick={() => handleQuickStatusChange("waiting_parts", "Job moved to Waiting for Parts.")}
                                  className="h-8 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  <Package className="w-3.5 h-3.5 mr-1" />
                                  Waiting for Parts
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updatingStatus}
                                  onClick={() => handleQuickStatusChange("cancelled", "Job marked as Cancelled / Declined.")}
                                  className="h-8 text-xs font-medium text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Customer Declined
                                </Button>
                              </div>
                            </div>
                          ) : job.status === "in_progress" ? (
                            <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Repair Authorized by Customer. Work is in progress.</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleQuickStatusChange("ready_for_delivery", "Job marked as Ready for Pickup!")}
                                className="h-7 text-xs font-medium bg-[#009688] hover:bg-[#00897b] text-white"
                              >
                                Mark Ready for Delivery
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 py-1">
                              Current status: <strong className="text-slate-700 dark:text-slate-300">{VALID_STATUSES.find(s => s.value === job.status)?.label || job.status}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Historical Diagnosis Log */}
                      {diagnoses.length > 1 && (
                        <div className="pt-4 space-y-3">
                          <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                            Diagnosis History ({diagnoses.length})
                          </h4>
                          <div className="space-y-2">
                            {diagnoses.map((diag, index) => {
                              const revIndex = diagnoses.length - index;
                              const isLatest = index === 0;

                              return (
                                <div
                                  key={diag.id}
                                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                                    isLatest
                                      ? "border-teal-200/80 bg-teal-50/20 dark:border-teal-900/40 dark:bg-teal-950/10"
                                      : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                                        Diagnosis Record #{revIndex}
                                      </span>
                                      {diag.employee && (
                                        <span className="text-slate-400">
                                          • {diag.employee.full_name}
                                        </span>
                                      )}
                                      {isLatest && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-teal-50 text-[#009688] border border-teal-200">
                                          Active Latest
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-slate-400 font-mono">
                                      {formatDate(diag.created_at)}
                                    </span>
                                  </div>

                                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                                    {diag.diagnosis}
                                  </p>

                                  <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span>Action: {diag.recommended_action || "—"}</span>
                                    <span className="font-semibold text-[#009688]">
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
                      <div className="space-y-1">
                        <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                          No diagnosis recorded yet.
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Inspect device hardware and record the diagnostic assessment and estimated cost.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsDiagnosisModalOpen(true)}
                        className="h-8 text-xs font-medium shrink-0 ml-4"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Diagnosis
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
              <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Package className="w-4 h-4 text-[#009688]" />
                    Spare Part Procurement Requests
                  </CardTitle>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPartRequestModalOpen(true)}
                    className="h-8 text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Request Spare Part
                  </Button>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
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
              <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                    <History className="w-4 h-4 text-[#009688]" />
                    Current Technician & Work History
                  </CardTitle>
                  <Button
                    variant={job.assigned_employee ? "outline" : "primary"}
                    size="sm"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="h-8 text-xs font-medium"
                  >
                    <User className="w-3.5 h-3.5 mr-1" />
                    {job.assigned_employee ? "Reassign Technician" : "Assign Technician"}
                  </Button>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-6">
                  {job.assigned_employee ? (
                    <div className="rounded-xl bg-slate-50/80 p-4 sm:p-5 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Active Assigned Technician
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-0.5">
                          <Link
                            href={`/employees/${job.assigned_employee.id}`}
                            className="font-bold text-slate-900 dark:text-white text-base hover:text-[#009688] transition-colors"
                          >
                            {job.assigned_employee.full_name}
                          </Link>
                          <span className="text-xs font-mono font-medium text-slate-500">
                            ({job.assigned_employee.employee_code})
                          </span>
                          <EmployeeRoleBadge role={job.assigned_employee.role} />
                        </div>
                        <p className="text-xs text-slate-500 capitalize">
                          Specialization: {job.assigned_employee.specialization || "General"}
                        </p>
                      </div>

                      <Link href={`/employees/${job.assigned_employee.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50/60 p-6 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                          Unassigned Job
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          No technician is currently assigned to work on this repair job.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="h-8 text-xs font-medium shrink-0 ml-4"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Assign Now
                      </Button>
                    </div>
                  )}

                  {/* Assignment History Log */}
                  {assignmentsHistory.length > 0 && (
                    <div className="pt-2 space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                        Assignment Log ({assignmentsHistory.length})
                      </h4>
                      <div className="space-y-2">
                        {assignmentsHistory.map((hist, idx) => (
                          <div
                            key={hist.id || idx}
                            className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/50 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white text-xs">
                                  {hist.employee?.full_name || "Technician"}
                                </span>
                                {hist.employee && <EmployeeRoleBadge role={hist.employee.role} />}
                                {!hist.unassigned_at ? (
                                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Current Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    Reassigned
                                  </span>
                                )}
                              </div>
                              {hist.notes && (
                                <p className="text-slate-500 italic mt-1">
                                  Note: {hist.notes}
                                </p>
                              )}
                            </div>

                            <div className="text-right text-slate-400 font-mono text-[11px]">
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
              <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                    <User className="w-4 h-4 text-[#009688]" />
                    Customer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-4 text-sm">
                  {job.customer ? (
                    <>
                      <div>
                        <span className="text-xs text-slate-400 font-medium block">Full Name</span>
                        <Link
                          href={`/customers/${job.customer.id}`}
                          className="font-semibold text-slate-900 hover:text-[#009688] dark:text-white text-base block mt-0.5 transition-colors"
                        >
                          {job.customer.full_name}
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Customer ID</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white text-xs">{job.customer.customer_code}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Phone Number</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{job.customer.phone}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link href={`/customers/${job.customer.id}`}>
                          <Button variant="outline" size="sm" fullWidth className="h-8 text-xs font-medium">
                            View Customer Profile
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
              <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Laptop className="w-4 h-4 text-[#009688]" />
                    Device Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-4 text-sm">
                  {job.device ? (
                    <>
                      <div>
                        <span className="text-xs text-slate-400 font-medium block">Brand & Model</span>
                        <Link
                          href={`/devices/${job.device.id}`}
                          className="font-semibold text-slate-900 hover:text-[#009688] dark:text-white text-base block mt-0.5 transition-colors"
                        >
                          {job.device.brand} {job.device.model}
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Device Code</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white text-xs">{job.device.device_code}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Device Type</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 capitalize text-xs">{job.device.device_type}</span>
                        </div>
                      </div>

                      {(job.device.serial_number || job.device.imei) && (
                        <div className="text-xs">
                          <span className="text-slate-400 block font-medium">Serial Number / IMEI</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{job.device.serial_number || job.device.imei}</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link href={`/devices/${job.device.id}`}>
                          <Button variant="outline" size="sm" fullWidth className="h-8 text-xs font-medium">
                            View Device Details
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

          {newStatus === "ready_for_delivery" && (
            <div className="rounded-lg bg-emerald-50/70 p-3 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
              Marking as <strong>Ready for Pickup</strong> will timestamp the repair completion and notify that the device has passed inspection.
            </div>
          )}

          {newStatus === "delivered" && (
            <div className="space-y-3 rounded-lg bg-teal-50/60 p-3.5 border border-teal-200/60 dark:bg-teal-950/30 dark:border-teal-800">
              <span className="text-xs font-semibold text-teal-900 dark:text-teal-200 block">
                Confirm Final Billed Amount (₹)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Final amount charged to customer"
                value={finalCostInput}
                onChange={(e) => setFinalCostInput(e.target.value)}
                className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#009688]"
              />
              <p className="text-[11px] text-teal-700 dark:text-teal-300">
                This will finalize the job billing and record delivery timestamp.
              </p>
            </div>
          )}
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

      {/* Customer Quotation Preview Modal */}
      {job && latestDiagnosis && (
        <Modal
          isOpen={isQuotationPreviewModalOpen}
          onClose={() => setIsQuotationPreviewModalOpen(false)}
          title="Customer Diagnosis Quotation Preview"
          description={`Pre-formatted quotation ready to send to ${job.customer?.full_name || "Customer"}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuotationPreviewModalOpen(false)}
              >
                Close Preview
              </Button>

              <div className="flex items-center gap-2">
                {quotationTab === "whatsapp" ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const q = getCustomerQuotationTexts();
                        if (q) handleCopyQuotation(q.whatsappMessage, "wa");
                      }}
                      className="text-xs"
                    >
                      {copiedType === "wa" ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy Text
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSendWhatsAppEstimate}
                      className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      Open WhatsApp
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const q = getCustomerQuotationTexts();
                        if (q) handleCopyQuotation(q.emailBody, "email");
                      }}
                      className="text-xs"
                    >
                      {copiedType === "email" ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy Email Body
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSendEmailEstimate}
                      className="text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      Open Email App
                    </Button>
                  </>
                )}
              </div>
            </div>
          }
        >
          {(() => {
            const q = getCustomerQuotationTexts();
            if (!q) return null;

            return (
              <div className="space-y-4">
                {/* Channel Selector Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
                  <button
                    type="button"
                    onClick={() => setQuotationTab("whatsapp")}
                    className={`pb-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                      quotationTab === "whatsapp"
                        ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp Message Format
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuotationTab("email")}
                    className={`pb-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                      quotationTab === "email"
                        ? "border-sky-600 text-sky-700 dark:text-sky-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email Template Format
                  </button>
                </div>

                {/* Recipient Details Strip */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Recipient Customer</span>
                    <p className="font-semibold text-slate-900 dark:text-white">{job.customer?.full_name}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Contact Target</span>
                    <p className="font-mono text-slate-700 dark:text-slate-300">
                      {quotationTab === "whatsapp"
                        ? q.customerPhone || "No phone registered"
                        : q.customerEmail || "No email registered"}
                    </p>
                  </div>
                </div>

                {/* Content Box */}
                {quotationTab === "whatsapp" ? (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      WhatsApp Message Preview:
                    </span>
                    <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 max-h-72 overflow-y-auto">
                      {q.whatsappMessage}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Subject:
                      </span>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {q.emailSubject}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Body:
                      </span>
                      <div className="p-3.5 rounded-lg bg-sky-50/40 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 max-h-60 overflow-y-auto">
                        {q.emailBody}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Delete Job Confirmation Modal (ADMIN RESTRICTED) */}
      {job && canDeleteJob && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Repair Job Card"
          description={`Permanently delete job ticket #${job.job_code}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deletingJob}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deletingJob}
                onClick={handleDeleteJob}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Confirm Delete Job
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {deleteError && (
              <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 leading-relaxed font-medium">
                {deleteError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                    Admin Protected Action
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                    Irreversible
                  </span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  Are you sure you want to delete job ticket <strong className="font-mono">{job.job_code}</strong>? This will permanently erase the job record, technician assignment logs, technical diagnoses, and linked procurement requests.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{job.customer?.full_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Device:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{job.device?.brand} {job.device?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-semibold capitalize text-[#009688]">{job.status.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
