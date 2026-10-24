"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Customer, getCustomerWithHistory } from "@/modules/customers";
import { Device } from "@/types/device";
import { RepairJob } from "@/types/job";
import { AppShell } from "@/components/layout/AppShell";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Alert,
  LoadingSpinner,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { JobPriorityBadge } from "@/components/jobs/JobPriorityBadge";
import { BRANCHES } from "@/types/branch";
import {
  ArrowLeft,
  User,
  Phone,
  PhoneCall,
  Mail,
  MapPin,
  Wrench,
  Laptop,
  Pencil,
  Plus,
  MessageCircle,
  Copy,
  Check,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [copiedCode, setCopiedCode] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadAllCustomerData() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserEmail(user.email);

        const result = await getCustomerWithHistory(id);

        if (result.error || !result.customer) {
          setError(result.error || "Customer record not found.");
        } else {
          setCustomer(result.customer);
          setDevices(result.devices);
          setJobs(result.jobs);
        }
      } catch (err: unknown) {
        setError("An unexpected error occurred while fetching customer details.");
      } finally {
        setLoading(false);
      }
    }

    loadAllCustomerData();
  }, [id, supabase]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const cleanPhone = customer?.phone.replace(/[^0-9]/g, "") || "";
  const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const initials = customer
    ? customer.full_name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CU";

  const activeJobsCount = jobs.filter(
    (j) => !["delivered", "cancelled", "unrepairable"].includes(j.status?.toLowerCase() || "")
  ).length;

  const completedJobsCount = jobs.filter(
    (j) => ["delivered"].includes(j.status?.toLowerCase() || "")
  ).length;

  const branchLabel = customer?.branch
    ? customer.branch === "both"
      ? "Both Labs"
      : BRANCHES[customer.branch]?.shortName || customer.branch
    : null;

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6 w-full">
        {/* Top Header & Breadcrumb */}
        <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-5">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Customers Directory
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Customer Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-base flex items-center justify-center font-sans shrink-0">
                {initials}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-sans text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {customer ? customer.full_name : "Customer Profile"}
                  </h1>

                  {customer && (
                    <button
                      type="button"
                      onClick={() => handleCopyCode(customer.customer_code)}
                      title="Click to copy Customer ID"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors text-xs font-mono font-semibold"
                    >
                      <span>{customer.customer_code}</span>
                      {copiedCode ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {customer && (
              <div className="flex items-center gap-2 flex-wrap">
                {cleanPhone && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    WhatsApp
                  </a>
                )}

                <a
                  href={`tel:${customer.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Call
                </a>

                <Link href={`/customers/${customer.id}/edit`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                    <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Edit
                  </Button>
                </Link>

                <Link href={`/devices/new?customerId=${customer.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                    <Laptop className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Add Device
                  </Button>
                </Link>

                <Link href={`/jobs/new?customerId=${customer.id}`}>
                  <Button variant="primary" size="sm" className="h-8 text-xs font-medium">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    New Job
                  </Button>
                </Link>
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
          <div className="flex flex-col justify-center items-center py-24 space-y-3">
            <LoadingSpinner size="lg" className="text-[#009688]" />
            <p className="text-xs text-slate-400">Loading customer details...</p>
          </div>
        ) : customer ? (
          <div className="space-y-6">
            {/* Minimal High-Density Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Registered Devices</span>
                  <Laptop className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-2 text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
                  {devices.length}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Active Jobs</span>
                  <Clock className="w-4 h-4 text-[#009688]" />
                </div>
                <div className="mt-2 text-2xl font-bold font-sans tracking-tight text-[#009688]">
                  {activeJobsCount}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Completed Repairs</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
                  {completedJobsCount}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Total Tickets</span>
                  <Wrench className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-2 text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
                  {jobs.length}
                </div>
              </div>
            </div>

            {/* Main Split: Left Column (Customer Details) | Right Column (Devices & Jobs) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Customer Information */}
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#009688]" />
                      Customer Details
                    </h3>
                    <Link href={`/customers/${customer.id}/edit`}>
                      <span className="text-xs text-slate-500 hover:text-[#009688] font-medium transition-colors cursor-pointer">
                        Edit
                      </span>
                    </Link>
                  </div>

                  <div className="space-y-4 text-sm">
                    {/* Primary Phone */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Phone</span>
                      <a
                        href={`tel:${customer.phone}`}
                        className="font-medium text-slate-900 dark:text-white hover:text-[#009688] transition-colors"
                      >
                        {customer.phone}
                      </a>
                    </div>

                    {/* Alternate Phone */}
                    {customer.alternate_phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Alt Phone</span>
                        <a
                          href={`tel:${customer.alternate_phone}`}
                          className="font-medium text-slate-900 dark:text-white hover:text-[#009688] transition-colors"
                        >
                          {customer.alternate_phone}
                        </a>
                      </div>
                    )}

                    {/* Email */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Email</span>
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          className="font-medium text-slate-900 dark:text-white hover:text-[#009688] transition-colors truncate max-w-[200px]"
                        >
                          {customer.email}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>

                    {/* City & State */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">City / State</span>
                      <span className="font-medium text-slate-900 dark:text-white text-right">
                        {[customer.city, customer.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>

                    {/* Branch */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Primary Branch</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {branchLabel || "—"}
                      </span>
                    </div>

                    {/* Street Address */}
                    {customer.address && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        <span className="text-xs text-slate-500 font-medium block">Address</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {customer.address}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {customer.notes && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        <span className="text-xs text-slate-500 font-medium block">Internal Notes</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap rounded-md bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
                          {customer.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Columns: Registered Devices & Repair Job History */}
              <div className="lg:col-span-2 space-y-6">
                {/* Registered Devices */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-[#009688]" />
                      <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Registered Devices ({devices.length})
                      </h3>
                    </div>

                    <Link href={`/devices/new?customerId=${customer.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs font-medium">
                        <Plus className="w-3.5 h-3.5 mr-1 text-[#009688]" />
                        Add Device
                      </Button>
                    </Link>
                  </div>

                  {devices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 pl-4">
                              Device ID
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3">
                              Type
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3">
                              Brand & Model
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3">
                              Serial / IMEI
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 text-right pr-4">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {devices.map((device) => (
                            <TableRow
                              key={device.id}
                              className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                            >
                              <TableCell className="py-3 pl-4 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {device.device_code}
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                                  {device.device_type?.replace(/_/g, " ")}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 font-medium text-slate-900 dark:text-slate-100 text-sm">
                                {device.brand} {device.model}
                              </TableCell>
                              <TableCell className="py-3 font-mono text-xs text-slate-500">
                                {device.serial_number || device.imei || "—"}
                              </TableCell>
                              <TableCell className="py-3 text-right pr-4 whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link href={`/jobs/new?customerId=${customer.id}&deviceId=${device.id}`}>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs font-medium text-[#009688] hover:text-[#00796b]">
                                      + Job
                                    </Button>
                                  </Link>
                                  <Link href={`/devices/${device.id}`}>
                                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs font-medium">
                                      View
                                    </Button>
                                  </Link>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-10 text-center space-y-2">
                      <p className="text-xs text-slate-400">
                        No devices registered for this customer yet.
                      </p>
                      <Link href={`/devices/new?customerId=${customer.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Register Device
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Repair Jobs History */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#009688]" />
                      <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Repair Job History ({jobs.length})
                      </h3>
                    </div>

                    <Link href={`/jobs/new?customerId=${customer.id}`}>
                      <Button variant="primary" size="sm" className="h-7 text-xs font-medium">
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Create Job
                      </Button>
                    </Link>
                  </div>

                  {jobs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 pl-4 whitespace-nowrap">
                              Job ID
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3">
                              Device
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                              Priority
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                              Status
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                              Date
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 text-right pr-4 whitespace-nowrap">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jobs.map((job) => (
                            <TableRow
                              key={job.id}
                              className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                            >
                              <TableCell className="py-3 pl-4 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {job.job_code}
                              </TableCell>
                              <TableCell className="py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                                {job.device ? (
                                  <Link
                                    href={`/devices/${job.device.id}`}
                                    className="hover:text-[#009688] transition-colors"
                                  >
                                    {job.device.brand} {job.device.model}
                                  </Link>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="py-3 whitespace-nowrap">
                                <JobPriorityBadge priority={job.priority} />
                              </TableCell>
                              <TableCell className="py-3 whitespace-nowrap">
                                <JobStatusBadge status={job.status} />
                              </TableCell>
                              <TableCell className="py-3 text-xs text-slate-500 whitespace-nowrap">
                                {formatDate(job.received_at)}
                              </TableCell>
                              <TableCell className="py-3 text-right pr-4 whitespace-nowrap">
                                <Link href={`/jobs/${job.id}`}>
                                  <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs font-medium">
                                    View
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-10 text-center space-y-2">
                      <p className="text-xs text-slate-400">
                        No repair tickets recorded for this customer yet.
                      </p>
                      <Link href={`/jobs/new?customerId=${customer.id}`}>
                        <Button variant="primary" size="sm" className="h-8 text-xs font-medium">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Create First Job
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans text-base font-semibold text-slate-900 dark:text-white">
                Customer Not Found
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                The requested customer record does not exist or may have been removed.
              </p>
            </div>
            <Link href="/customers">
              <Button variant="primary" size="sm">
                Return to Directory
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
