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

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignedJobs, setAssignedJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
        }

        // Fetch employee details
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("*")
          .eq("id", employeeId)
          .single();

        if (empError) throw empError;
        setEmployee(empData);

        // Fetch assigned repair jobs
        const { data: jobsData, error: jobsError } = await supabase
          .from("repair_jobs")
          .select(`
            *,
            customer:customers(id, customer_code, full_name, phone),
            device:devices(id, device_code, device_type, brand, model)
          `)
          .eq("assigned_employee_id", employeeId)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;
        setAssignedJobs(jobsData || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load employee profile.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [employeeId, supabase]);

  if (loading) {
    return (
      <AppShell userEmail={userEmail}>
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" className="text-[#009688]" />
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
              &larr; Back to Employees
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
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/employees" className="hover:text-[#009688] transition-colors">
            Employees
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">
            {employee.employee_code}
          </span>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {employee.full_name}
                </h1>
                <Badge variant="primary">{employee.employee_code}</Badge>
                {employee.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Inactive</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <EmployeeRoleBadge role={employee.role} />
                <span>•</span>
                <span className="capitalize font-medium">
                  Specialization: {employee.specialization || "General"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/employees/${employee.id}/edit`}>
              <Button variant="primary" size="sm">
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Employee
              </Button>
            </Link>
          </div>
        </div>

        {/* Workload Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Jobs
                </p>
                <p className="text-2xl font-black text-[#009688] mt-1">
                  {activeJobs.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#009688]/10 text-[#009688] flex items-center justify-center font-bold">
                ⚡
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Completed Jobs
                </p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {completedJobs.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                ✓
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Jobs Assigned
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {assignedJobs.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                📋
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info & Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact & Personal Info */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>👤</span> Personal & Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Display Name</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.display_name || employee.full_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Mobile Number</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.phone ? `+91 ${employee.phone}` : "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Alternate Phone</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.alternate_phone || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Email Address</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.email || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Identification No.</span>
                <span className="font-medium font-mono text-slate-900 dark:text-white">{employee.id_number || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Gender / DOB</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {employee.gender || "—"} {employee.dob ? `(${new Date(employee.dob).toLocaleDateString()})` : ""}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Address Details */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>📍</span> Address Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Address Line</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.address_line || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">City / Town</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.city_town || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Region / State</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.region_state || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Postal / ZIP Code</span>
                <span className="font-medium font-mono text-slate-900 dark:text-white">{employee.postal_code || "—"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>🏦</span> Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Account Name</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.bank_account_name || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Bank Name</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.bank_name || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Branch</span>
                <span className="font-medium text-slate-900 dark:text-white">{employee.bank_branch || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">Account Number</span>
                <span className="font-medium font-mono text-slate-900 dark:text-white">{employee.bank_account_number || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block font-semibold">IFSC Code</span>
                <span className="font-medium font-mono text-slate-900 dark:text-white">{employee.bank_ifsc || "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Jobs Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Assigned Jobs ({assignedJobs.length})
          </h3>

          {assignedJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      <Badge variant="primary">{job.job_code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {job.customer?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {job.device ? `${job.device.brand} ${job.device.model}` : "Unknown Device"}
                    </TableCell>
                    <TableCell>
                      <JobPriorityBadge priority={job.priority} />
                    </TableCell>
                    <TableCell>
                      <JobStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(job.received_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          View Job
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No jobs assigned"
              description="This employee currently has no repair jobs assigned to them."
            />
          )}
        </div>
    </AppShell>
  );
}
