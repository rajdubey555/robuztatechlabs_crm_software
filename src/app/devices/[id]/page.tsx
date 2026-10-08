"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Device } from "@/types/device";
import { RepairJob } from "@/types/job";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Alert, LoadingSpinner, EmptyState, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { JobPriorityBadge } from "@/components/jobs/JobPriorityBadge";
import { BRANCHES, CATEGORIES } from "@/types/branch";

export default function DeviceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadDeviceAndJobs() {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch device with customer and attachments
      const { data: devData, error: fetchError } = await supabase
        .from("devices")
        .select(`
          *,
          customer:customers (
            id,
            customer_code,
            full_name,
            phone
          ),
          attachments:device_attachments (*)
        `)
        .eq("id", id)
        .single();

      if (fetchError || !devData) {
        setError("Device not found or error loading data.");
        setLoading(false);
        return;
      }

      setDevice(devData);

      // Fetch repair jobs for this device
      const { data: jobsData } = await supabase
        .from("repair_jobs")
        .select("*")
        .eq("device_id", id)
        .order("created_at", { ascending: false });

      setJobs(jobsData || []);
      setLoading(false);
    }

    loadDeviceAndJobs();
  }, [id, supabase]);

  const formatDate = (dateStr?: string) => {
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

  return (
    <AppShell userEmail={userEmail}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/devices"
              className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
            >
              ← Back to Devices List
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {device ? `${device.brand} ${device.model}` : "Device Details"}
              </h1>
              {device && (
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-sm px-3 py-1 font-mono">
                    {device.device_code}
                  </Badge>
                  <Badge variant="default" className="text-sm">
                    {device.device_type}
                  </Badge>
                  {device.branch && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${BRANCHES[device.branch]?.badgeColor || ""}`}>
                      📍 {BRANCHES[device.branch]?.shortName}
                    </span>
                  )}
                  {device.category_type && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${CATEGORIES[device.category_type]?.badgeColor || ""}`}>
                      {CATEGORIES[device.category_type]?.icon} {CATEGORIES[device.category_type]?.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {device && (
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/jobs/new?deviceId=${device.id}&customerId=${device.customer_id}`}>
                <Button variant="primary">
                  + Create Repair Job
                </Button>
              </Link>
              <Link href={`/devices/${device.id}/edit`}>
                <Button variant="outline">
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Device
                </Button>
              </Link>
            </div>
          )}
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
        ) : device ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <Card className="lg:col-span-2 shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Device Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">Brand</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {device.brand}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">Model</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {device.model}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">Serial Number</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {device.serial_number || "Not specified"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">IMEI</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {device.imei || "Not specified"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">Color</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {device.color || "Not specified"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">RAM / Storage</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {device.ram || "—"} / {device.storage || "—"}
                    </span>
                  </div>
                </div>

                {device.operating_system && (
                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">Operating System</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {device.operating_system}
                    </span>
                  </div>
                )}

                {device.password_note && (
                  <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/20 p-3.5 border border-amber-200/80 dark:border-amber-900/60">
                    <span className="text-xs text-amber-800 dark:text-amber-400 font-bold block">
                      🔑 Password / PIN Note
                    </span>
                    <p className="text-sm font-mono text-amber-900 dark:text-amber-300 mt-0.5">
                      {device.password_note}
                    </p>
                  </div>
                )}

                {/* Intake Conditions & Accessories */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Accessories Received</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {device.accessories || "No accessories specified."}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Physical Condition</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {device.physical_condition || "No physical damage reported."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar: Customer Info & Metadata */}
            <div className="space-y-6">
              {/* Customer Owner Card */}
              <Card className="shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Owner / Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {device.customer ? (
                    <>
                      <Link
                        href={`/customers/${device.customer.id}`}
                        className="font-bold text-[#009688] hover:underline block text-base"
                      >
                        {device.customer.full_name}
                      </Link>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p>Customer ID: <span className="font-mono font-semibold">{device.customer.customer_code}</span></p>
                        <p>Phone: <span className="font-medium text-slate-700 dark:text-slate-300">{device.customer.phone}</span></p>
                      </div>
                      <div className="pt-2">
                        <Link href={`/customers/${device.customer.id}`}>
                          <Button variant="outline" size="sm" fullWidth>
                            View Customer Profile
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400 text-xs">Customer details unavailable.</p>
                  )}
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Registration Meta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Registered Date</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {formatDate(device.created_at)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block font-medium">Last Updated</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {formatDate(device.updated_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Intake Photos Gallery */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Intake Photos ({device.attachments?.length || 0})
              </h3>
              {device.attachments && device.attachments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {device.attachments.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedImage(photo.file_url)}
                      className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-square dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#009688]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.file_url}
                        alt={photo.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No intake photos uploaded"
                  description="No intake photos were attached during device registration."
                />
              )}
            </div>

            {/* Repair Jobs Section */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Repair Jobs ({jobs.length})
                </h3>
                <Link href={`/jobs/new?deviceId=${device.id}&customerId=${device.customer_id}`}>
                  <Button variant="primary" size="sm">
                    + Create Repair Job
                  </Button>
                </Link>
              </div>

              {jobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Complaint</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          <Badge variant="primary">{job.job_code}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {job.customer_complaint}
                        </TableCell>
                        <TableCell>
                          <JobPriorityBadge priority={job.priority} />
                        </TableCell>
                        <TableCell>
                          <JobStatusBadge status={job.status} />
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {formatDate(job.received_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No repair jobs for this device yet."
                  description="Open a new repair job card for this device."
                  action={
                    <Link href={`/jobs/new?deviceId=${device.id}&customerId=${device.customer_id}`}>
                      <Button variant="primary" size="sm">
                        + Create Repair Job
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Device Not Found"
            description="The requested device record does not exist or was removed."
            action={
              <Link href="/devices">
                <Button variant="primary" size="sm">
                  Return to Devices List
                </Button>
              </Link>
            }
          />
        )}

      {/* Image Modal Preview */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title="Intake Photo Preview"
      >
        {selectedImage && (
          <div className="flex justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Device preview"
              className="max-h-[70vh] rounded-lg object-contain"
            />
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
