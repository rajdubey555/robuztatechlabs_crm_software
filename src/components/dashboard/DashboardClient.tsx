"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RepairJob } from "@/types/job";
import { Customer } from "@/types/customer";
import { Device } from "@/types/device";
import { Employee } from "@/types/employee";
import { Diagnosis } from "@/types/diagnosis";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Alert, LoadingSpinner, EmptyState, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { JobPriorityBadge } from "@/components/jobs/JobPriorityBadge";
import { useBranchContext } from "@/context/BranchContext";
import { BRANCHES, CATEGORIES } from "@/types/branch";
import {
  getDashboardData,
  calculateDashboardMetrics,
  calculateAttentionMetrics,
  calculatePipelineCounts,
  ActivityItem,
} from "@/modules/dashboard";

export interface DashboardClientProps {
  userEmail?: string;
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const router = useRouter();
  const { selectedBranch, selectedCategory, activeBranchInfo, activeCategoryInfo, isFiltered, clearFilters } = useBranchContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState<Diagnosis[]>([]);

  // Search & Filter states
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string>("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
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
        const message = err instanceof Error ? err.message : "Failed to load dashboard data.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Dynamically Filtered Jobs by Branch & Category Context
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (selectedBranch !== "all" && j.branch && j.branch !== selectedBranch) return false;
      if (selectedCategory !== "all" && j.category_type && j.category_type !== selectedCategory) return false;
      return true;
    });
  }, [jobs, selectedBranch, selectedCategory]);

  // Dynamically Filtered Customers by Branch Context
  const filteredCustomersCount = useMemo(() => {
    return customers.filter((c) => {
      if (selectedBranch !== "all" && c.branch && c.branch !== "both" && c.branch !== selectedBranch) return false;
      return true;
    }).length;
  }, [customers, selectedBranch]);

  // Dynamically Filtered Devices by Branch & Category Context
  const filteredDevicesCount = useMemo(() => {
    return devices.filter((d) => {
      if (selectedBranch !== "all" && d.branch && d.branch !== selectedBranch) return false;
      if (selectedCategory !== "all" && d.category_type && d.category_type !== selectedCategory) return false;
      return true;
    }).length;
  }, [devices, selectedBranch, selectedCategory]);

  // Dynamically Filtered Employees by Branch Context
  const filteredEmployeesCount = useMemo(() => {
    return employees.filter((e) => {
      if (selectedBranch !== "all" && e.branch && e.branch !== "both" && e.branch !== selectedBranch) return false;
      return true;
    }).length;
  }, [employees, selectedBranch]);

  // Metrics Calculations based on filtered jobs
  const metrics = useMemo(() => calculateDashboardMetrics(filteredJobs), [filteredJobs]);

  // Needs Attention Calculations
  const attentionItems = useMemo(() => calculateAttentionMetrics(filteredJobs), [filteredJobs]);

  // Workflow Pipeline Counts
  const pipelineCounts = useMemo(() => calculatePipelineCounts(filteredJobs), [filteredJobs]);



  // Filtered recent jobs for table view
  const filteredRecentJobs = useMemo(() => {
    let result = filteredJobs;
    if (selectedPipelineStage) {
      result = result.filter((j) => j.status === selectedPipelineStage);
    }
    return result.slice(0, 8);
  }, [filteredJobs, selectedPipelineStage]);

  // Recent Activity Stream Generation
  const recentActivities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Add recent jobs
    filteredJobs.slice(0, 4).forEach((j) => {
      items.push({
        id: `job-${j.id}`,
        type: "job",
        title: `Job Card Created: ${j.job_code}`,
        description: `Customer: ${j.customer?.full_name || "Client"} • Issue: ${j.customer_complaint.slice(0, 45)}...`,
        timestamp: j.created_at,
        link: `/jobs/${j.id}`,
      });
    });

    // Add recent diagnoses
    recentDiagnoses.slice(0, 3).forEach((d) => {
      items.push({
        id: `diag-${d.id}`,
        type: "diagnosis",
        title: `Diagnosis Recorded`,
        description: `${d.employee?.full_name || "Technician"}: ${d.diagnosis.slice(0, 45)}... (Est: ₹${d.estimated_cost || 0})`,
        timestamp: d.created_at,
        link: `/jobs/${d.repair_job_id}`,
      });
    });

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [filteredJobs, recentDiagnoses]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  return (
    <AppShell userEmail={userEmail}>
      {/* 1. TOP GREETING & OPERATIONAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>⚡</span> Robuzta Repair Operations Dashboard
            </h1>
            {activeBranchInfo && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeBranchInfo.badgeColor}`}>
                📍 {activeBranchInfo.shortName}
              </span>
            )}
            {activeCategoryInfo && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeCategoryInfo.badgeColor}`}>
                {activeCategoryInfo.icon} {activeCategoryInfo.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeBranchInfo ? activeBranchInfo.address : "Viewing all lab branches combined analytics"}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-semibold text-slate-700 dark:text-slate-300">
              👥 {filteredCustomersCount} Customers
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-semibold text-slate-700 dark:text-slate-300">
              💻 {filteredDevicesCount} Devices
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-semibold text-slate-700 dark:text-slate-300">
              👨‍🔧 {filteredEmployeesCount} Technicians
            </span>
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-amber-600 underline hover:text-amber-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions Dropdown */}
        <div className="relative">
          <Button
            variant="primary"
            size="md"
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            className="flex items-center gap-2"
          >
            <span>+ Quick Create</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>

          {quickCreateOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-2 shadow-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 z-50 space-y-1">
              <Link
                href="/jobs/new"
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e0f2f1] hover:text-[#004d40] rounded-lg transition-colors"
              >
                <span>📋</span> + New Repair Job
              </Link>
              <Link
                href="/customers/new"
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e0f2f1] hover:text-[#004d40] rounded-lg transition-colors"
              >
                <span>👤</span> + New Customer
              </Link>
              <Link
                href="/devices/new"
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e0f2f1] hover:text-[#004d40] rounded-lg transition-colors"
              >
                <span>💻</span> + New Device
              </Link>
              <Link
                href="/employees/new"
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e0f2f1] hover:text-[#004d40] rounded-lg transition-colors"
              >
                <span>👨‍🔧</span> + New Employee
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* BRANCH COMPARISON CARD IF ALL BRANCHES SELECTED */}
      {selectedBranch === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(BRANCHES).map((branch) => {
            const branchJobs = jobs.filter((j) => j.branch === branch.id);
            const activeCount = branchJobs.filter(
              (j) => !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
            ).length;
            const rev = branchJobs.reduce((acc, j) => acc + (Number(j.final_cost) || 0), 0);

            return (
              <div
                key={branch.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      {branch.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{branch.subtitle}</p>
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Total Jobs: {branchJobs.length}
                    </span>
                    <span className="font-semibold text-amber-600">
                      Active: {activeCount}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Revenue</span>
                  <span className="text-lg font-black text-[#009688]">
                    {formatCurrency(rev)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
          {/* 2. CORE BUSINESS METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-xs border-l-4 border-l-slate-700 hover:shadow-md transition-all">
              <CardContent className="px-5 py-5 pt-6 min-h-[145px] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total Repair Tickets
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">
                    📋
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {metrics.totalJobs}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">Filtered tickets recorded</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-amber-500 hover:shadow-md transition-all">
              <CardContent className="px-5 py-5 pt-6 min-h-[145px] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Active In-Progress
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm">
                    ⚙️
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 leading-tight">
                    {metrics.pendingJobs}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">Active repairs undergoing service</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
              <CardContent className="px-5 py-5 pt-6 min-h-[145px] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Completed & Delivered
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">
                    ✅
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-tight">
                    {metrics.completedJobs}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">Repairs completed & handed over</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-l-4 border-l-[#009688] hover:shadow-md transition-all">
              <CardContent className="px-5 py-5 pt-6 min-h-[145px] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#009688]">
                    Billed Revenue
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#e0f2f1] dark:bg-[#004d40]/40 text-[#009688] flex items-center justify-center text-sm">
                    💰
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#009688] leading-tight">
                    {formatCurrency(metrics.revenue)}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">Billed completed revenue</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. OPERATIONAL ACTION FOCUS */}
          <div className="space-y-3 pt-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>⚠️</span> Operational Action Focus
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-xs border-l-4 border-l-rose-500 hover:shadow-md transition-all">
                <CardContent className="px-5 py-5 pt-6 min-h-[135px] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Urgent / High Priority
                    </span>
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                      {attentionItems.urgentCount}
                    </span>
                    <Link href="/jobs" className="shrink-0">
                      <Button variant="outline" size="sm" className="px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-colors">
                        View →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-l-4 border-l-amber-500 hover:shadow-md transition-all">
                <CardContent className="px-5 py-5 pt-6 min-h-[135px] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Unassigned Tech Jobs
                    </span>
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                      {attentionItems.unassignedCount}
                    </span>
                    <Link href="/jobs" className="shrink-0">
                      <Button variant="outline" size="sm" className="px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 transition-colors">
                        Assign →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-l-4 border-l-sky-500 hover:shadow-md transition-all">
                <CardContent className="px-5 py-5 pt-6 min-h-[135px] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                      Pending Diagnosis
                    </span>
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                      {attentionItems.pendingDiagnosisCount}
                    </span>
                    <Link href="/jobs" className="shrink-0">
                      <Button variant="outline" size="sm" className="px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300 transition-colors">
                        Inspect →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
                <CardContent className="px-5 py-5 pt-6 min-h-[135px] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Ready / Diagnosed
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                      {attentionItems.readyDeliveryCount}
                    </span>
                    <Link href="/jobs" className="shrink-0">
                      <Button variant="outline" size="sm" className="px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-colors">
                        Review →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 4. WORKFLOW PIPELINE INTERACTIVE STAGES */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>🔄</span> Repair Job Workflow Stages
                </span>
                {selectedPipelineStage && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPipelineStage("")}>
                    Reset Filter
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  onClick={() => setSelectedPipelineStage(selectedPipelineStage === "received" ? "" : "received")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPipelineStage === "received"
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">1. Received Intake</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5">
                    {pipelineCounts.received}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedPipelineStage(selectedPipelineStage === "diagnosis_pending" ? "" : "diagnosis_pending")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPipelineStage === "diagnosis_pending"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">2. In Diagnosis</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5">
                    {pipelineCounts.diagnosis}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedPipelineStage(selectedPipelineStage === "diagnosed" ? "" : "diagnosed")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPipelineStage === "diagnosed"
                      ? "border-[#009688] bg-[#e0f2f1] dark:bg-[#004d40]/30 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#009688] block">3. Ready for Repair</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5">
                    {pipelineCounts.diagnosed}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedPipelineStage(selectedPipelineStage === "unrepairable" ? "" : "unrepairable")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPipelineStage === "unrepairable"
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">4. Unrepairable</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5">
                    {pipelineCounts.unrepairable}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedPipelineStage(selectedPipelineStage === "cancelled" ? "" : "cancelled")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPipelineStage === "cancelled"
                      ? "border-slate-500 bg-slate-100 dark:bg-slate-800 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">5. Cancelled</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5">
                    {pipelineCounts.cancelled}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 5 & 6. RECENT REPAIR JOBS & CRM ACTIVITY STREAM */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Jobs Queue (2 Columns) */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📋</span> Active Repair Queue
                </h2>
                <Link href="/jobs">
                  <Button variant="outline" size="sm">
                    View All Jobs →
                  </Button>
                </Link>
              </div>

              {filteredRecentJobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Branch & Category</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecentJobs.map((job) => {
                      const branchInfo = job.branch ? BRANCHES[job.branch] : BRANCHES["south_bopal"];
                      const catInfo = job.category_type ? CATEGORIES[job.category_type] : CATEGORIES["laptop_general"];

                      return (
                        <TableRow
                          key={job.id}
                          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          <TableCell className="font-mono text-xs font-semibold">
                            <Badge variant="primary">{job.job_code}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-max ${branchInfo.badgeColor}`}>
                                📍 {branchInfo.shortName}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-max ${catInfo.badgeColor}`}>
                                {catInfo.icon} {catInfo.shortName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            {job.customer?.full_name || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                            {job.device ? `${job.device.brand} ${job.device.model}` : "—"}
                          </TableCell>
                          <TableCell>
                            <JobStatusBadge status={job.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/jobs/${job.id}`} onClick={(e) => e.stopPropagation()}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No repair jobs found"
                  description="No repair jobs match your current branch or category selection."
                />
              )}
            </div>

            {/* Recent CRM Activity Stream (1 Column) */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📡</span> Operations Activity Stream
              </h2>

              <Card className="shadow-xs">
                <CardContent className="p-4 space-y-4">
                  {recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivities.map((act) => (
                        <Link
                          key={act.id}
                          href={act.link}
                          className="block p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-[#009688]/40 transition-all space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {act.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDate(act.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {act.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No recent operations recorded.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
