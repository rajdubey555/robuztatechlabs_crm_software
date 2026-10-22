"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Search,
  Plus,
  ArrowUpRight,
  Laptop,
  Users,
  Activity,
  ChevronRight,
  Clock,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { RepairJob } from "@/types/job";
import { Customer } from "@/types/customer";
import { Device } from "@/types/device";
import { Employee } from "@/types/employee";
import { Diagnosis } from "@/types/diagnosis";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import { BRANCHES } from "@/types/branch";
import { getDashboardData } from "@/modules/dashboard";

export interface DashboardClientProps {
  userEmail?: string;
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const router = useRouter();
  const { selectedBranch, selectedCategory, activeBranchInfo, activeCategoryInfo, isFiltered, clearFilters } = useBranchContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Data
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState<Diagnosis[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await getDashboardData();
        if (res.error) throw new Error(res.error);

        setJobs(res.data.jobs);
        setCustomers(res.data.customers);
        setDevices(res.data.devices);
        setEmployees(res.data.employees);
        setRecentDiagnoses(res.data.recentDiagnoses);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard metrics.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered by branch & category
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (selectedBranch !== "all" && j.branch && j.branch !== selectedBranch) return false;
      if (selectedCategory !== "all" && j.category_type && j.category_type !== selectedCategory) return false;
      return true;
    });
  }, [jobs, selectedBranch, selectedCategory]);

  // High-Impact North Star KPIs (shadcn-style metrics)
  const metrics = useMemo(() => {
    const activeJobs = filteredJobs.filter(
      (j) => !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
    );

    const attentionJobs = activeJobs.filter(
      (j) => !j.assigned_employee_id || ["critical", "high"].includes(j.priority)
    );

    const readyJobs = filteredJobs.filter((j) => j.status === "diagnosed");

    const totalRevenue = filteredJobs.reduce((acc, j) => {
      const val = Number(j.final_cost || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    return {
      activeCount: activeJobs.length,
      attentionCount: attentionJobs.length,
      readyCount: readyJobs.length,
      totalRevenue,
    };
  }, [filteredJobs]);

  // Visual Pipeline Stages Breakdown
  const pipeline = useMemo(() => {
    const received = filteredJobs.filter((j) => j.status === "received").length;
    const inDiagnosis = filteredJobs.filter((j) => j.status === "diagnosis_pending").length;
    const ready = filteredJobs.filter((j) => j.status === "diagnosed").length;
    const completed = filteredJobs.filter((j) => ["delivered", "closed"].includes(j.status)).length;
    const total = filteredJobs.length || 1;

    return {
      received,
      inDiagnosis,
      ready,
      completed,
      receivedPct: Math.round((received / total) * 100),
      diagnosisPct: Math.round((inDiagnosis / total) * 100),
      readyPct: Math.round((ready / total) * 100),
      completedPct: Math.round((completed / total) * 100),
    };
  }, [filteredJobs]);

  // Category Distribution (Visual meter: Laptop vs Drone)
  const categoryStats = useMemo(() => {
    const total = filteredJobs.length || 1;
    const laptops = filteredJobs.filter((j) => (j.category_type || "laptop_general") === "laptop_general").length;
    const drones = filteredJobs.filter((j) => j.category_type === "drone").length;

    return {
      laptops,
      drones,
      laptopPct: Math.round((laptops / total) * 100),
      dronePct: Math.round((drones / total) * 100),
    };
  }, [filteredJobs]);

  // Technician Workload
  const techWorkload = useMemo(() => {
    const techs = employees.filter(
      (e) => e.is_active && ["technician", "admin", "manager"].includes(e.role)
    );

    const countMap: Record<string, number> = {};
    filteredJobs.forEach((j) => {
      if (
        j.assigned_employee_id &&
        !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
      ) {
        countMap[j.assigned_employee_id] = (countMap[j.assigned_employee_id] || 0) + 1;
      }
    });

    return techs
      .map((t) => ({
        id: t.id,
        name: t.full_name,
        role: t.specialization || t.role,
        count: countMap[t.id] || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [employees, filteredJobs]);

  // Filtered queue table
  const queueJobs = useMemo(() => {
    let result = filteredJobs;

    if (statusFilter !== "ALL") {
      if (statusFilter === "attention") {
        result = result.filter(
          (j) =>
            !["delivered", "closed", "cancelled"].includes(j.status) &&
            (!j.assigned_employee_id || ["critical", "high"].includes(j.priority))
        );
      } else {
        result = result.filter((j) => j.status === statusFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((j) => {
        const code = j.job_code?.toLowerCase() || "";
        const name = j.customer?.full_name?.toLowerCase() || "";
        const phone = j.customer?.phone || "";
        const device = `${j.device?.brand || ""} ${j.device?.model || ""}`.toLowerCase();
        return code.includes(q) || name.includes(q) || phone.includes(q) || device.includes(q);
      });
    }

    return result.slice(0, 8);
  }, [filteredJobs, statusFilter, searchQuery]);

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Received</span>;
      case "diagnosis_pending":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40">In Diagnosis</span>;
      case "diagnosed":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/40">Ready</span>;
      case "unrepairable":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40">Unrepairable</span>;
      case "cancelled":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">{status}</span>;
    }
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="w-full space-y-6">

        {/* 1. TOP BAR: TITLE + WORKSPACE CONTEXT + ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Dashboard
              </h1>
              {activeBranchInfo ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {activeBranchInfo.shortName}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  All Branches
                </span>
              )}
              {activeCategoryInfo && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {activeCategoryInfo.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time service center overview and repair operations performance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/jobs/new">
              <Button size="sm" className="bg-[#009688] hover:bg-[#00796b] text-white gap-1.5 shadow-xs font-medium">
                <Plus className="w-4 h-4" />
                <span>New Ticket</span>
              </Button>
            </Link>
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
        ) : (
          <>
            {/* 2. SHADCN-STYLE 4 KPI CARDS (CLEAN & MINIMALIST) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Revenue */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Revenue</span>
                  <IndianRupee className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    {formatCurrency(metrics.totalRevenue)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Billed completed orders
                  </p>
                </div>
              </div>

              {/* Card 2: Active Repairs */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Work orders</span>
                  <Wrench className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    {metrics.activeCount}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Currently under service
                  </p>
                </div>
              </div>

              {/* Card 3: Ready for Pickup */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ready for Pickup</span>
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    {metrics.readyCount}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Repaired & awaiting customer
                  </p>
                </div>
              </div>

              {/* Card 4: Action Required */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Action Required</span>
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    {metrics.attentionCount}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Unassigned or urgent priority
                  </p>
                </div>
              </div>

            </div>

            {/* 3. VISUAL PIPELINE PROGRESS STRIP (SHADCN VISUALIZATION) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Repair Pipeline Funnel
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Distribution of all {filteredJobs.length} tickets across service stages
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    Intake: {pipeline.received}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Diagnosis: {pipeline.inDiagnosis}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#009688]" />
                    Ready: {pipeline.ready}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Delivered: {pipeline.completed}
                  </span>
                </div>
              </div>

              {/* Progress Bar Visualization */}
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${pipeline.receivedPct}%` }}
                  className="bg-slate-300 dark:bg-slate-600 transition-all duration-500"
                  title={`Received: ${pipeline.received}`}
                />
                <div
                  style={{ width: `${pipeline.diagnosisPct}%` }}
                  className="bg-amber-400 transition-all duration-500"
                  title={`Diagnosis: ${pipeline.inDiagnosis}`}
                />
                <div
                  style={{ width: `${pipeline.readyPct}%` }}
                  className="bg-[#009688] transition-all duration-500"
                  title={`Ready: ${pipeline.ready}`}
                />
                <div
                  style={{ width: `${pipeline.completedPct}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Delivered: ${pipeline.completed}`}
                />
              </div>
            </div>

            {/* 4. MAIN WORKSPACE: ACTIVE QUEUE TABLE (LEFT) + CAPACITY & SPECS (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">

              {/* LEFT 5 COLUMNS: CLEAN SHADCN DATA TABLE */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Table Header with Search & Filter */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Recent Work Orders
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Active ticket stream across registered devices
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-full sm:w-52">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter orders..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#009688]"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-medium text-slate-700 dark:text-slate-300"
                      >
                        <option value="ALL">All Status</option>
                        <option value="attention">Needs Attention</option>
                        <option value="received">Received</option>
                        <option value="diagnosis_pending">In Diagnosis</option>
                        <option value="diagnosed">Ready</option>
                      </select>
                    </div>
                  </div>

                  {/* Clean Dense Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4 font-medium">Ticket ID</th>
                          <th className="py-2.5 px-4 font-medium">Customer</th>
                          <th className="py-2.5 px-4 font-medium">Device & Issue</th>
                          <th className="py-2.5 px-4 font-medium">Technician</th>
                          <th className="py-2.5 px-4 font-medium">Status</th>
                          <th className="py-2.5 px-4 font-medium text-right">Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {queueJobs.length > 0 ? (
                          queueJobs.map((job) => (
                            <tr
                              key={job.id}
                              onClick={() => router.push(`/jobs/${job.id}`)}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                                {job.job_code}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-900 dark:text-slate-200">
                                  {job.customer?.full_name || "Walk-in"}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {job.customer?.phone || "—"}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-800 dark:text-slate-300 line-clamp-1">
                                  {job.device ? `${job.device.brand} ${job.device.model}` : "General Repair"}
                                </div>
                                <div className="text-[11px] text-slate-400 line-clamp-1">
                                  {job.customer_complaint}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {job.assigned_employee ? (
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {job.assigned_employee.full_name.split(" ")[0]}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {getStatusBadge(job.status)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                                {job.estimated_cost ? formatCurrency(Number(job.estimated_cost)) : "—"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-slate-400">
                              No tickets match current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer link */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
                  <span>Showing {queueJobs.length} of {filteredJobs.length} tickets</span>
                  <Link href="/jobs" className="text-[#009688] font-medium hover:underline inline-flex items-center gap-1">
                    <span>View all work orders</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* RIGHT 2 COLUMNS: VISUAL BREAKDOWN & TECH DISPATCH */}
              <div className="lg:col-span-2 space-y-6">

                {/* Widget 1: Device Category Distribution */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Device Specialization
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Intake proportion by category
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 font-medium">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Laptop className="w-3.5 h-3.5 text-slate-400" />
                          Laptops & Computers
                        </span>
                        <span className="font-mono text-slate-500">{categoryStats.laptops} ({categoryStats.laptopPct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${categoryStats.laptopPct}%` }}
                          className="h-full bg-[#009688] rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 font-medium">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          Drones & Specialized
                        </span>
                        <span className="font-mono text-slate-500">{categoryStats.drones} ({categoryStats.dronePct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${categoryStats.dronePct}%` }}
                          className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Widget 2: Technician Dispatch Capacity */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Technician Dispatch
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Active load per workbench
                      </p>
                    </div>
                    <Link href="/employees" className="text-xs text-slate-400 hover:text-slate-600">
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {techWorkload.length > 0 ? (
                      techWorkload.map((tech) => (
                        <div key={tech.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              {tech.name}
                            </span>
                            <span className="font-mono text-slate-500 tabular-nums">
                              {tech.count} active
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(tech.count * 20, 100)}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                tech.count >= 4
                                  ? "bg-rose-500"
                                  : tech.count > 0
                                  ? "bg-[#009688]"
                                  : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-2">No active technicians.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </>
        )}

      </div>
    </AppShell>
  );
}
