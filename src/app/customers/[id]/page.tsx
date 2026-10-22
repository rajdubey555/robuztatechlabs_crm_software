"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Customer, getCustomerWithHistory } from "@/modules/customers";
import { Device } from "@/types/device";
import { RepairJob } from "@/types/job";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Alert, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { JobPriorityBadge } from "@/components/jobs/JobPriorityBadge";
import { BRANCHES } from "@/types/branch";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const supabase = createClient();

  useEffect(() => {
    async function loadAllCustomerData() {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch customer profile & history via service
      const result = await getCustomerWithHistory(id);

      if (result.error || !result.customer) {
        setError(result.error || "Customer not found or error loading data.");
      } else {
        setCustomer(result.customer);
        setDevices(result.devices);
        setJobs(result.jobs);
      }
      setLoading(false);
    }

    loadAllCustomerData();
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
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/customers"
              className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
            >
              ← Back to Customers List
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {customer ? customer.full_name : "Customer Details"}
              </h1>
              {customer && (
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-sm px-3 py-1">
                    {customer.customer_code}
                  </Badge>
                  {customer.branch && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${BRANCHES[customer.branch === "both" ? "south_bopal" : customer.branch]?.badgeColor || ""}`}>
                      📍 {customer.branch === "both" ? "Both Branches" : BRANCHES[customer.branch]?.shortName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {customer && (
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/jobs/new?customerId=${customer.id}`}>
                <Button variant="primary">
                  + Create Repair Job
                </Button>
              </Link>
              <Link href={`/devices/new?customerId=${customer.id}`}>
                <Button variant="outline">
                  + Add Device
                </Button>
              </Link>
              <Link href={`/customers/${customer.id}/edit`}>
                <Button variant="ghost">
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
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
        ) : customer ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info Card */}
            <Card className="lg:col-span-2 shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Contact & Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">Phone Number</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {customer.phone}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">Alternate Phone</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {customer.alternate_phone || "Not specified"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">Email Address</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                      {customer.email || "Not specified"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium block">City</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {customer.city || "Not specified"}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-medium block">Address</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {customer.address || "No address entered."}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-medium block">Notes</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {customer.notes || "No notes recorded."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps & Meta Card */}
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Customer ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {customer.customer_code}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Created Date</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {formatDate(customer.created_at)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block font-medium">Last Updated</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {formatDate(customer.updated_at)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Devices Section */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Registered Devices ({devices.length})
                </h3>
                <Link href={`/devices/new?customerId=${customer.id}`}>
                  <Button variant="outline" size="sm">
                    + Add Device
                  </Button>
                </Link>
              </div>

              {devices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Brand & Model</TableHead>
                      <TableHead>Serial / IMEI</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          <Badge variant="primary">{device.device_code}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{device.device_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          {device.brand} {device.model}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {device.serial_number || device.imei || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/devices/${device.id}`}>
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
                  title="No devices registered for this customer yet."
                  description="Click '+ Add Device' to register a laptop, phone, or tablet for this customer."
                  action={
                    <Link href={`/devices/new?customerId=${customer.id}`}>
                      <Button variant="primary" size="sm">
                        + Add Device
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>

            {/* Repair Jobs Section */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Repair Jobs ({jobs.length})
                </h3>
                <Link href={`/jobs/new?customerId=${customer.id}`}>
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
                      <TableHead>Device</TableHead>
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
                        <TableCell>
                          {job.device ? (
                            <Link href={`/devices/${job.device.id}`} className="hover:underline font-medium">
                              {job.device.brand} {job.device.model} ({job.device.device_code})
                            </Link>
                          ) : (
                            "—"
                          )}
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
                  title="No repair jobs created for this customer yet."
                  description="Open a new job card for this customer's device."
                  action={
                    <Link href={`/jobs/new?customerId=${customer.id}`}>
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
            title="Customer Not Found"
            description="The requested customer record does not exist or was removed."
            action={
              <Link href="/customers">
                <Button variant="primary" size="sm">
                  Return to Customers List
                </Button>
              </Link>
            }
          />
        )}
    </AppShell>
  );
}
