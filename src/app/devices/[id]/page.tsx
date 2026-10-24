"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Device, getDeviceWithHistory, deleteDeviceAttachment } from "@/modules/devices";
import { RepairJob } from "@/types/job";
import { AppShell } from "@/components/layout/AppShell";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  LoadingSpinner,
  Modal,
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
  Laptop,
  Pencil,
  Plus,
  Copy,
  Check,
  User,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Key,
  HardDrive,
  Eye,
  Wrench,
  ImageIcon,
  Trash2,
} from "lucide-react";

export default function DeviceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadDeviceAndJobs() {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch device and history via service
      const result = await getDeviceWithHistory(id);

      if (result.error || !result.device) {
        setError(result.error || "Device not found or error loading data.");
      } else {
        setDevice(result.device);
        setJobs(result.jobs);
      }
      setLoading(false);
    }

    loadDeviceAndJobs();
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

  const branchLabel = device?.branch ? BRANCHES[device.branch]?.shortName : null;

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6 w-full">
        {/* Navigation & Header */}
        <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-5">
          <Link
            href="/devices"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Devices Directory
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-base flex items-center justify-center shrink-0">
                <Laptop className="w-6 h-6 text-[#009688]" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-sans text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {device ? `${device.brand} ${device.model}` : "Device Details"}
                  </h1>

                  {device && (
                    <button
                      type="button"
                      onClick={() => handleCopyCode(device.device_code)}
                      title="Click to copy Device ID"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors text-xs font-mono font-semibold"
                    >
                      <span>{device.device_code}</span>
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

            {device && (
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/jobs/new?deviceId=${device.id}&customerId=${device.customer_id}`}>
                  <Button variant="primary" size="sm" className="h-8 text-xs font-medium">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    New Repair Job
                  </Button>
                </Link>

                <Link href={`/devices/${device.id}/edit`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                    <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Edit Device
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
          <div className="flex justify-center items-center py-24">
            <LoadingSpinner size="lg" className="text-[#009688]" />
          </div>
        ) : device ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Device Specifications & Intake Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-[#009688]" />
                      Device Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg bg-slate-50/75 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium block">Brand</span>
                        <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                          {device.brand}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50/75 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium block">Model</span>
                        <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                          {device.model}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50/75 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium block">Serial Number</span>
                        <span className="font-mono text-sm text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {device.serial_number || "—"}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50/75 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium block">IMEI</span>
                        <span className="font-mono text-sm text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {device.imei || "—"}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50/75 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium block">Color</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {device.color || "—"}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50/75 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium block">RAM / Storage</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {device.ram || "—"} / {device.storage || "—"}
                        </span>
                      </div>
                    </div>

                    {device.operating_system && (
                      <div className="rounded-lg bg-slate-50/75 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium block">Operating System</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {device.operating_system}
                        </span>
                      </div>
                    )}

                    {device.password_note && (
                      <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/20 p-3.5 border border-amber-200/80 dark:border-amber-900/60">
                        <span className="text-xs text-amber-800 dark:text-amber-400 font-medium flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5" />
                          Password / PIN Note
                        </span>
                        <p className="text-sm font-mono text-amber-900 dark:text-amber-300 mt-1">
                          {device.password_note}
                        </p>
                      </div>
                    )}

                    {/* Accessories & Physical Condition */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-slate-400 font-medium block">Accessories Received</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                          {device.accessories || "No accessories noted"}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs text-slate-400 font-medium block">Intake Physical Condition</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                          {device.physical_condition || "Clean condition"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Col: Customer & Metadata */}
              <div className="space-y-6">
                <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#009688]" />
                      Customer / Owner
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3.5 text-sm">
                    {device.customer ? (
                      <>
                        <div>
                          <Link
                            href={`/customers/${device.customer.id}`}
                            className="font-semibold text-slate-900 dark:text-white hover:text-[#009688] transition-colors block text-base"
                          >
                            {device.customer.full_name}
                          </Link>
                          <span className="text-xs font-mono text-slate-400 block mt-0.5">
                            {device.customer.customer_code}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-500 font-medium">Phone</span>
                          <a
                            href={`tel:${device.customer.phone}`}
                            className="font-medium text-slate-900 dark:text-white hover:text-[#009688] transition-colors"
                          >
                            {device.customer.phone}
                          </a>
                        </div>

                        <Link href={`/customers/${device.customer.id}`} className="block pt-1">
                          <Button variant="outline" size="sm" fullWidth className="h-8 text-xs font-medium">
                            View Customer Profile
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">No customer linked</span>
                    )}
                  </CardContent>
                </Card>

                {/* Dates & Branch Metadata Card */}
                <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                    <div className="flex items-center justify-between pb-3">
                      <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                        <span className="w-4 h-4 flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                        </span>
                        Registered On
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(device.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                        <span className="w-4 h-4 flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                        </span>
                        Last Updated
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(device.updated_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                        <span className="w-4 h-4 flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                        </span>
                        Branch
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {branchLabel || "South Bopal Lab"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Intake Photos Gallery */}
            {device.attachments && device.attachments.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#009688]" />
                    <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Intake Photos ({device.attachments.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">Click photo to zoom</span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {device.attachments.map((att) => (
                    <div
                      key={att.id}
                      onClick={() => setSelectedImage(att.file_url)}
                      className="relative group rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square min-h-[110px] shadow-2xs cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Repair Job History for this device */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#009688]" />
                  <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Repair Job History ({jobs.length})
                  </h3>
                </div>

                <Link href={`/jobs/new?deviceId=${device.id}&customerId=${device.customer_id}`}>
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
                          Customer Complaint
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                          Priority
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3 whitespace-nowrap">
                          Received Date
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
                          <TableCell className="py-3 text-sm text-slate-700 dark:text-slate-300 max-w-md">
                            <span className="line-clamp-1">{job.customer_complaint}</span>
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
                                <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
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
                    No repair tickets recorded for this device yet.
                  </p>
                  <Link href={`/jobs/new?deviceId=${device.id}&customerId=${device.customer_id}`}>
                    <Button variant="primary" size="sm" className="h-8 text-xs font-medium">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Create First Job
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4">
            <h3 className="font-sans text-base font-semibold text-slate-900 dark:text-white">
              Device Not Found
            </h3>
            <p className="text-xs text-slate-500">
              The requested device record does not exist or may have been deleted.
            </p>
            <Link href="/devices">
              <Button variant="primary" size="sm">
                Return to Devices
              </Button>
            </Link>
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <Modal
            isOpen={Boolean(selectedImage)}
            onClose={() => setSelectedImage(null)}
            title="Intake Photo Preview"
          >
            <div className="p-2 space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Intake Preview"
                className="max-h-[70vh] w-full object-contain rounded-lg shadow-sm"
              />
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">Intake verification photo</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                  onClick={async () => {
                    const att = device?.attachments?.find((a) => a.file_url === selectedImage);
                    if (att) {
                      await deleteDeviceAttachment(att.id, att.file_url);
                      setDevice((prev) =>
                        prev
                          ? {
                              ...prev,
                              attachments: prev.attachments?.filter((a) => a.id !== att.id),
                            }
                          : null
                      );
                      setSelectedImage(null);
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete from Storage & DB
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
