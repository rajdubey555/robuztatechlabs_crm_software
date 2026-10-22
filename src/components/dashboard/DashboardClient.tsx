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
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { JobPriorityBadge } from "@/components/jobs/JobPriorityBadge";
import { useBranchContext } from "@/context/BranchContext";
import { BRANCHES, CATEGORIES } from "@/types/branch";
import { getDashboardData, ActivityItem } from "@/modules/dashboard";
import { buildWhatsAppClickUrl } from "@/modules/procurement";

export interface DashboardClientProps {
  userEmail?: string;
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const router = useRouter();
  const {
    selectedBranch,
    selectedCategory,
    activeBranchInfo,
    activeCategoryInfo,
    isFiltered,
    clearFilters,
  } = useBranchContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState<Diagnosis[]>([]);

  // Interactive filters inside the dashboard
  const [activeQueueTab, setActiveQueueTab] = useState<"all" | "attention" | "ready">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
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

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Filtered jobs by branch & category context
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (selectedBranch !== "all" && j.branch && j.branch !== selectedBranch) return false;
      if (selectedCategory !== "all" && j.category_type && j.category_type !== selectedCategory) return false;
      return true;
    });
  }, [jobs, selectedBranch, selectedCategory]);

  // THE BIG 4 NORTH-STAR METRICS
  const kpis = useMemo(() => {
    // 1. Active jobs currently under repair or inspection
    const activeJobs = filteredJobs.filter(
      (j) => !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
    );

    // 2. Needs Attention: High priority OR Not yet assigned to any technician
    const attentionJobs = activeJobs.filter(
      (j) => !j.assigned_employee_id || ["critical", "high"].includes(j.priority)
    );

    // 3. Ready for Customer Pickup / Diagnosed
    const readyJobs = filteredJobs.filter(
      (j) => j.status === "diagnosed" || ["delivered", "closed"].includes(j.status)
    );
    const pendingPickupCount = filteredJobs.filter((j) => j.status === "diagnosed").length;

    // 4. Revenue
    const totalRevenue = filteredJobs.reduce((acc, j) => {
      const val = Number(j.final_cost || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    return {
      activeCount: activeJobs.length,
      attentionCount: attentionJobs.length,
      pendingPickupCount,
      totalRevenue,
    };
  }, [filteredJobs]);

  // Workflow Pipeline Stage Counts
  const pipeline = useMemo(() => {
    return {
      received: filteredJobs.filter((j) => j.status === "received").length,
      diagnosis_pending: filteredJobs.filter((j) => j.status === "diagnosis_pending").length,
      diagnosed: filteredJobs.filter((j) => j.status === "diagnosed").length,
      unrepairable: filteredJobs.filter((j) => j.status === "unrepairable").length,
      cancelled: filteredJobs.filter((j) => j.status === "cancelled").length,
    };
  }, [filteredJobs]);

  // Technician Workbench Workload calculation
  const technicianStats = useMemo(() => {
    const techs = employees.filter(
      (e) => e.is_active && ["technician", "admin", "manager"].includes(e.role)
    );

    // Calculate active workload per technician from filtered jobs
    const workloadMap: Record<string, number> = {};
    filteredJobs.forEach((j) => {
      if (
        j.assigned_employee_id &&
        !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
      ) {
        workloadMap[j.assigned_employee_id] = (workloadMap[j.assigned_employee_id] || 0) + 1;
      }
    });

    return techs.map((t) => ({
      ...t,
      activeJobs: workloadMap[t.id] || 0,
    })).sort((a, b) => b.activeJobs - a.activeJobs);
  }, [employees, filteredJobs]);

  // Active Queue filtered by Tab + Search + Stage
  const activeQueue = useMemo(() => {
    let result = filteredJobs.filter(
      (j) => !["delivered", "closed", "cancelled"].includes(j.status)
    );

    // Filter by Tab
    if (activeQueueTab === "attention") {
      result = result.filter(
        (j) => !j.assigned_employee_id || ["critical", "high"].includes(j.priority)
      );
    } else if (activeQueueTab === "ready") {
      result = result.filter((j) => j.status === "diagnosed");
    }

    // Filter by Pipeline Stage
    if (selectedStage !== "ALL") {
      result = result.filter((j) => j.status === selectedStage);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((j) => {
        const code = j.job_code?.toLowerCase() || "";
        const custName = j.customer?.full_name?.toLowerCase() || "";
        const custPhone = j.customer?.phone || "";
        const device = `${j.device?.brand || ""} ${j.device?.model || ""}`.toLowerCase();
        const complaint = j.customer_complaint?.toLowerCase() || "";
        return code.includes(q) || custName.includes(q) || custPhone.includes(q) || device.includes(q) || complaint.includes(q);
      });
    }

    return result.slice(0, 10);
  }, [filteredJobs, activeQueueTab, selectedStage, searchQuery]);

  // Recent Live Activity Stream
  const recentActivities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    filteredJobs.slice(0, 4).forEach((j) => {
      items.push({
        id: `job-${j.id}`,
        type: "job",
        title: `Job Card: ${j.job_code}`,
        description: `${j.customer?.full_name || "Customer"} • ${j.device?.brand || ""} ${j.device?.model || "Device"}`,
        timestamp: j.created_at,
        link: `/jobs/${j.id}`,
      });
    });

    recentDiagnoses.slice(0, 3).forEach((d) => {
      items.push({
        id: `diag-${d.id}`,
        type: "diagnosis",
        title: `Diagnosis Done`,
        description: `${d.employee?.full_name || "Tech"}: ${d.diagnosis.slice(0, 40)}...`,
        timestamp: d.created_at,
        link: `/jobs/${d.repair_job_id}`,
      });
    });

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [filteredJobs, recentDiagnoses]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const getTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">

        {/* 1. CLEAN EXECUTIVE HERO HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-700/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">👋</span>
              <h1 className="text-2xl font-black tracking-tight text-white font-heading">
                {greeting}, Team
              </h1>
              {activeBranchInfo ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#009688]/20 text-teal-300 border border-[#009688]/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  📍 {activeBranchInfo.shortName} Lab
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600">
                  🌐 All Branches Overview
                </span>
              )}
              {activeCategoryInfo && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  {activeCategoryInfo.icon} {activeCategoryInfo.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Live service center overview • Everything happening on your repair floor right now.
            </p>
          </div>

          {/* Primary Quick Create + Menu */}
          <div className="flex items-center gap-2 relative">
            <Link href="/jobs/new">
              <button className="px-5 py-2.5 bg-gradient-to-r from-[#009688] to-[#00796b] hover:from-[#00897b] hover:to-[#00695c] text-white font-bold text-sm rounded-xl shadow-md shadow-[#009688]/30 flex items-center gap-2 transition-all active:scale-95">
                <span className="text-lg leading-none">+</span>
                <span>New Job Card</span>
              </button>
            </Link>

            <button
              onClick={() => setQuickCreateOpen(!quickCreateOpen)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              title="More Actions"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {quickCreateOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-xl bg-white dark:bg-slate-900 p-1.5 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 space-y-1 text-slate-800 dark:text-slate-200 text-xs">
                <Link
                  href="/customers/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  <span>👤</span> New Customer
                </Link>
                <Link
                  href="/devices/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  <span>💻</span> New Device
                </Link>
                <Link
                  href="/part-requests"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  <span>📦</span> Order Spare Part
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
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <LoadingSpinner size="lg" className="text-[#009688]" />
            <p className="text-xs text-slate-400 font-medium">Loading live service center metrics...</p>
          </div>
        ) : (
          <>
            {/* 2. THE BIG 4 "NORTH-STAR" CARDS (SUPER EASY TO READ) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Active Jobs */}
              <div
                onClick={() => { setActiveQueueTab("all"); setSelectedStage("ALL"); }}
                className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#009688]/60 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Active Repairs
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {kpis.activeCount}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                    <span className="text-[#009688] font-bold">●</span> In repair or diagnosis now
                  </p>
                </div>
              </div>

              {/* Card 2: Needs Attention (Urgent or Unassigned) */}
              <div
                onClick={() => { setActiveQueueTab("attention"); setSelectedStage("ALL"); }}
                className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-xs transition-all group ${
                  kpis.attentionCount > 0
                    ? "border-amber-300 dark:border-amber-800 hover:border-amber-500"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Needs Attention
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                    ⚠️
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                    {kpis.attentionCount}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {kpis.attentionCount === 0 ? "Everything assigned & smooth" : "Unassigned or High priority"}
                  </p>
                </div>
              </div>

              {/* Card 3: Ready for Pickup */}
              <div
                onClick={() => { setActiveQueueTab("ready"); setSelectedStage("ALL"); }}
                className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/60 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Ready For Pickup
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                    📦
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {kpis.pendingPickupCount}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Repairs finished • Handover pending
                  </p>
                </div>
              </div>

              {/* Card 4: Total Revenue */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Billed Revenue
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center text-lg shadow-inner">
                    💰
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(kpis.totalRevenue)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Total revenue across tickets
                  </p>
                </div>
              </div>

            </div>

            {/* 3. SLEEK SEGMENTED REPAIR PIPELINE (ONE-CLICK FILTER) */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 whitespace-nowrap">
                Filter Stage:
              </span>

              <button
                onClick={() => setSelectedStage("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedStage === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>All Active</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {kpis.activeCount}
                </span>
              </button>

              <button
                onClick={() => setSelectedStage("received")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedStage === "received"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>📥 1. Received Intake</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-800">
                  {pipeline.received}
                </span>
              </button>

              <button
                onClick={() => setSelectedStage("diagnosis_pending")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedStage === "diagnosis_pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>🔍 2. Diagnosing</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
                  {pipeline.diagnosis_pending}
                </span>
              </button>

              <button
                onClick={() => setSelectedStage("diagnosed")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedStage === "diagnosed"
                    ? "bg-[#009688] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>🔧 3. Ready / Repaired</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 text-teal-800">
                  {pipeline.diagnosed}
                </span>
              </button>

              <button
                onClick={() => setSelectedStage("unrepairable")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedStage === "unrepairable"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>❌ Unrepairable</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800">
                  {pipeline.unrepairable}
                </span>
              </button>

              {selectedStage !== "ALL" && (
                <button
                  onClick={() => setSelectedStage("ALL")}
                  className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold ml-auto pr-2 whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>

            {/* 4. MAIN WORKSPACE: ACTIVE QUEUE (LEFT) + ACTION INTELLIGENCE (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT 2 COLUMNS: ACTIVE REPAIR TICKETS QUEUE */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 space-y-4">
                  
                  {/* Queue Tabs + Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveQueueTab("all")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeQueueTab === "all"
                            ? "bg-[#009688] text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        All Active Queue
                      </button>

                      <button
                        onClick={() => setActiveQueueTab("attention")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          activeQueueTab === "attention"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>🚨 Needs Action</span>
                        {kpis.attentionCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-700 font-black">
                            {kpis.attentionCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveQueueTab("ready")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeQueueTab === "ready"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        Ready for Pickup
                      </button>
                    </div>

                    {/* Instant Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search ticket, customer, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]"
                      />
                    </div>
                  </div>

                  {/* Clean, High-Information Ticket List */}
                  {activeQueue.length > 0 ? (
                    <div className="space-y-2.5">
                      {activeQueue.map((job) => {
                        const branchInfo = job.branch ? BRANCHES[job.branch] : BRANCHES["south_bopal"];
                        const catInfo = job.category_type ? CATEGORIES[job.category_type] : CATEGORIES["laptop_general"];
                        const customerPhone = job.customer?.phone;

                        return (
                          <div
                            key={job.id}
                            onClick={() => router.push(`/jobs/${job.id}`)}
                            className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#009688]/60 bg-white dark:bg-slate-900/60 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            {/* Device & Ticket Details */}
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0 text-base group-hover:bg-[#009688]/10 group-hover:text-[#009688] transition-colors">
                                {job.category_type === "drone" ? "🚁" : "💻"}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {job.job_code}
                                  </span>
                                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                                    {job.device ? `${job.device.brand} ${job.device.model}` : "Unknown Device"}
                                  </span>
                                  <JobPriorityBadge priority={job.priority} />
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-1">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{job.customer?.full_name || "Walk-in Client"}</span>
                                  {" • "}
                                  <span className="text-slate-500">{job.customer_complaint}</span>
                                </p>
                              </div>
                            </div>

                            {/* Status, Assigned Tech & Quick Actions */}
                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              {/* Customer WhatsApp Quick Action */}
                              {customerPhone && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const waMsg = `Hello ${job.customer?.full_name || "Customer"}, regarding your repair ticket ${job.job_code} at Robuzta Service Center:`;
                                    window.open(buildWhatsAppClickUrl(customerPhone, waMsg), "_blank");
                                  }}
                                  title="Chat on WhatsApp"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
                                  </svg>
                                </button>
                              )}

                              {/* Tech Assigned badge */}
                              {job.assigned_employee ? (
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                  👨‍🔧 {job.assigned_employee.full_name.split(" ")[0]}
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900">
                                  ⚠️ Unassigned
                                </span>
                              )}

                              <JobStatusBadge status={job.status} />

                              <span className="text-xs text-slate-400 group-hover:text-[#009688] font-bold">
                                →
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      title="No tickets match this filter"
                      description="No repair jobs found in current queue. Click '+ New Job Card' to create one."
                    />
                  )}

                  {/* View All Tickets Link */}
                  <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href="/jobs"
                      className="text-xs font-bold text-[#009688] hover:text-[#00796b] inline-flex items-center gap-1"
                    >
                      <span>Open Full Repair Jobs Database ({filteredJobs.length} tickets)</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* RIGHT 1 COLUMN: TECHNICIAN WORKLOAD + LIVE TIMELINE */}
              <div className="space-y-4">
                
                {/* Widget 1: Technician Live Workload */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>👨‍🔧</span> Technician Load
                    </h3>
                    <Link href="/employees" className="text-xs text-[#009688] hover:underline font-semibold">
                      Manage →
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {technicianStats.length > 0 ? (
                      technicianStats.slice(0, 5).map((tech) => {
                        const isBusy = tech.activeJobs >= 4;
                        const isFree = tech.activeJobs === 0;

                        return (
                          <div key={tech.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#009688]/10 text-[#009688] font-black flex items-center justify-center text-xs">
                                {tech.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {tech.full_name}
                                </p>
                                <p className="text-[10px] text-slate-400 capitalize">
                                  {tech.specialization || tech.role}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  isFree
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : isBusy
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                    : "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                                }`}
                              >
                                {tech.activeJobs} {tech.activeJobs === 1 ? "Job" : "Jobs"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 py-3 text-center">No active technicians registered.</p>
                    )}
                  </div>
                </div>

                {/* Widget 2: Live Activity Feed */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📡</span> Live Shop Updates
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">RECENT</span>
                  </div>

                  <div className="space-y-3">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((act) => (
                        <Link
                          key={act.id}
                          href={act.link}
                          className="block p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#009688]/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {act.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {getTimeAgo(act.timestamp)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {act.description}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No recent shop activity.</p>
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
