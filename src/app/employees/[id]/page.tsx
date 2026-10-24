"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Employee } from "@/types/employee";
import { RepairJob } from "@/types/job";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner, Badge, Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, EmptyState } from "@/components/ui";
import { EmployeeRoleBadge } from "@/components/employees/EmployeeRoleBadge";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { JobPriorityBadge } from "@/components/jobs/JobPriorityBadge";
import { BRANCHES } from "@/types/branch";
import { getEmployeeById, getEmployeeAssignedJobs } from "@/modules/employees";
import {
  ArrowLeft,
  Pencil,
  Key,
  User,
  MapPin,
  CreditCard,
  Wrench,
  CheckCircle2,
  Clock,
  Briefcase
} from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignedJobs, setAssignedJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
        }

        // Fetch employee details
        const empRes = await getEmployeeById(employeeId);
        if (empRes.error || !empRes.data) {
          throw new Error(empRes.error || "Employee not found");
        }
        setEmployee(empRes.data);

        // Fetch assigned repair jobs
        const jobsRes = await getEmployeeAssignedJobs(employeeId);
        if (jobsRes.error) {
          console.error("Failed to load assigned jobs:", jobsRes.error);
        }
        setAssignedJobs(jobsRes.data || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load employee profile.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [employeeId]);

  if (loading) {
    return (
      <AppShell userEmail={userEmail}>
        <div className="flex flex-col justify-center items-center py-24 space-y-3">
          <LoadingSpinner size="lg" className="text-[#009688]" />
          <p className="text-xs text-slate-400">Loading staff profile...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !employee) {
    return (
      <AppShell userEmail={userEmail}>
        <div className="space-y-4">
          <Alert variant="error" title="Employee Not Found">
            {error || "The requested employee record could not be found."}
          </Alert>
          <Link href="/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Employees Directory
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Workload calculations
  const activeJobs = assignedJobs.filter(
    (j) => !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
  );
  const completedJobs = assignedJobs.filter((j) =>
    ["delivered", "closed"].includes(j.status)
  );

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-5 w-full">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Employees Directory
          </Link>
          <span className="text-xs text-slate-400 font-mono">ID: {employee.employee_code}</span>
        </div>

        {/* TOP PROFILE HEADER */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#009688] font-bold text-lg flex items-center justify-center border border-teal-200 dark:border-teal-800 shrink-0">
                {employee.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {employee.full_name}
                  </h1>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {employee.employee_code}
                  </span>
                  <EmployeeRoleBadge role={employee.role} />
                  {employee.is_active ? (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Active Staff
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Inactive
                    </span>
                  )}
                  {employee.branch && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {employee.branch === "both" ? "Both Branches" : BRANCHES[employee.branch as "south_bopal" | "tragad"]?.shortName || employee.branch}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Specialization: <strong className="capitalize text-slate-700 dark:text-slate-300 font-medium">{employee.specialization || "General Repair"}</strong>
                  {employee.email ? ` • ${employee.email}` : ""}
                  {employee.phone ? ` • +91 ${employee.phone}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/permissions">
                <Button variant="outline" size="sm" className="h-8.5 text-xs font-semibold">
                  <Key className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Staff Permissions
                </Button>
              </Link>
              <Link href={`/employees/${employee.id}/edit`}>
                <Button variant="primary" size="sm" className="h-8.5 text-xs font-semibold">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Workload Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Active Jobs in Progress
                </span>
                <span className="text-xl font-bold font-mono tracking-tight text-[#009688] mt-0.5 block">
                  {activeJobs.length}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Completed Repairs
                </span>
                <span className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {completedJobs.length}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Lifetime Assigned
                </span>
                <span className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-0.5 block">
                  {assignedJobs.length}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-[#009688]" />
              </div>
            </div>
          </div>
        </div>

        {/* Info & Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Contact & Personal Info */}
          <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <User className="w-4 h-4 text-[#009688]" />
                Personal & Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Display Name</span>
                <span className="font-semibold text-slate-900 dark:text-white">{employee.display_name || employee.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Mobile Phone</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">{employee.phone ? `+91 ${employee.phone}` : "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Alternate Phone</span>
                <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">{employee.alternate_phone || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Email Address</span>
                <span className="font-semibold text-slate-900 dark:text-white">{employee.email || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Identification No.</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{employee.id_number || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Gender / DOB</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {employee.gender || "—"} {employee.dob ? `(${new Date(employee.dob).toLocaleDateString()})` : ""}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Address Details */}
          <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-[#009688]" />
                Address Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Address Line</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.address_line || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">City / Town</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.city_town || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Region / State</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.region_state || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Postal / ZIP Code</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{employee.postal_code || "—"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <CreditCard className="w-4 h-4 text-[#009688]" />
                Payout & Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Account Name</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.bank_account_name || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Bank Name</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.bank_name || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Branch</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.bank_branch || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Account Number</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{employee.bank_account_number || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">IFSC Code</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{employee.bank_ifsc || "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Jobs Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assigned Repair Jobs ({assignedJobs.length})
            </h3>
            <span className="text-xs text-slate-400">
              Active: {activeJobs.length} • Completed: {completedJobs.length}
            </span>
          </div>

          {assignedJobs.length > 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 dark:bg-slate-800/50">
                    <TableHead className="py-2.5 px-4 font-semibold text-xs">Job Code</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs">Customer</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs">Device</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs">Priority</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs">Status</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs">Received</TableHead>
                    <TableHead className="py-2.5 px-4 font-semibold text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {assignedJobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <TableCell className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        {job.job_code}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                        {job.customer?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                        {job.device ? `${job.device.brand} ${job.device.model}` : "Unknown Device"}
                      </TableCell>
                      <TableCell className="py-2.5 px-4">
                        <JobPriorityBadge priority={job.priority} />
                      </TableCell>
                      <TableCell className="py-2.5 px-4">
                        <JobStatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-slate-500 font-mono">
                        {new Date(job.received_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right">
                        <Link href={`/jobs/${job.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs font-medium">
                            View Job
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="No jobs assigned"
              description="This employee currently has no repair jobs assigned to them."
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
