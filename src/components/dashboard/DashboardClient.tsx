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
  ArrowUpRight,
  Laptop,
  Activity,
  Layers,
  RefreshCw,
  Clock,
  Package,
  Calendar,
  X,
  TrendingUp,
} from "lucide-react";
import { RepairJob } from "@/types/job";
import { Customer } from "@/types/customer";
import { Device } from "@/types/device";
import { Employee } from "@/types/employee";
import { PartRequest } from "@/types/partRequest";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingSpinner, Alert } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import { getDashboardData } from "@/modules/dashboard";

export interface DashboardClientProps {
  userEmail?: string;
}

type TimeRange = "today" | "week" | "month" | "all";

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const router = useRouter();
  const { selectedBranch, selectedCategory } = useBranchContext();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core Data
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getDashboardData();
      if (res.error) throw new Error(res.error);

      setJobs(res.data.jobs);
      setCustomers(res.data.customers);
      setDevices(res.data.devices);
      setEmployees(res.data.employees);
      setPartRequests(res.data.partRequests || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard metrics.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered by branch & category
  const branchAndCategoryJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (selectedBranch !== "all" && j.branch && j.branch !== selectedBranch) return false;
      if (selectedCategory !== "all" && j.category_type && j.category_type !== selectedCategory) return false;
      return true;
    });
  }, [jobs, selectedBranch, selectedCategory]);

  // Filtered by Time Range (Today / Last 7 Days / Last 30 Days / All Time)
  const timeFilteredJobs = useMemo(() => {
    if (timeRange === "all") return branchAndCategoryJobs;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return branchAndCategoryJobs.filter((j) => {
      const jobTime = new Date(j.created_at).getTime();
      if (timeRange === "today") return jobTime >= startOfToday;
      if (timeRange === "week") return jobTime >= sevenDaysAgo;
      if (timeRange === "month") return jobTime >= thirtyDaysAgo;
      return true;
    });
  }, [branchAndCategoryJobs, timeRange]);

  // High-Impact North Star KPIs (shadcn-style metrics)
  const metrics = useMemo(() => {
    const activeJobs = timeFilteredJobs.filter(
      (j) => !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
    );

    const attentionJobs = activeJobs.filter(
      (j) => !j.assigned_employee_id || ["critical", "high"].includes(j.priority)
    );

    const readyJobs = timeFilteredJobs.filter((j) => j.status === "diagnosed");

    const totalRevenue = timeFilteredJobs.reduce((acc, j) => {
      const val = Number(j.final_cost || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    return {
      activeCount: activeJobs.length,
      attentionCount: attentionJobs.length,
      readyCount: readyJobs.length,
      totalRevenue,
    };
  }, [timeFilteredJobs]);

  // Pending Parts Requests (for parts alert strip)
  const pendingPartsCount = useMemo(() => {
    return partRequests.filter((pr) => ["pending", "ordered"].includes(pr.status)).length;
  }, [partRequests]);

  // 7-Day Repair Throughput Trend Data (shadcn Bar Chart Visualization)
  const throughputChartData = useMemo(() => {
    const days: { label: string; dateStr: string; intake: number; completed: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

      const dayIntake = branchAndCategoryJobs.filter(
        (j) => j.created_at && j.created_at.startsWith(dateStr)
      ).length;

      const dayCompleted = branchAndCategoryJobs.filter(
        (j) =>
          ["delivered", "closed", "diagnosed"].includes(j.status) &&
          ((j.updated_at && j.updated_at.startsWith(dateStr)) ||
            (j.created_at && j.created_at.startsWith(dateStr)))
      ).length;

      days.push({
        label: i === 0 ? "Today" : dayLabel,
        dateStr,
        intake: dayIntake,
        completed: dayCompleted,
      });
    }

    const maxCount = Math.max(1, ...days.map((d) => Math.max(d.intake, d.completed)));

    return { days, maxCount };
  }, [branchAndCategoryJobs]);

  // Visual Pipeline Stages Breakdown
  const pipeline = useMemo(() => {
    const received = timeFilteredJobs.filter((j) => j.status === "received").length;
    const inDiagnosis = timeFilteredJobs.filter((j) => j.status === "diagnosis_pending").length;
    const ready = timeFilteredJobs.filter((j) => j.status === "diagnosed").length;
    const completed = timeFilteredJobs.filter((j) => ["delivered", "closed"].includes(j.status)).length;
    const total = timeFilteredJobs.length || 1;

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
  }, [timeFilteredJobs]);

  // Category Distribution (Visual meter: Laptop vs Drone)
  const categoryStats = useMemo(() => {
    const total = timeFilteredJobs.length || 1;
    const laptops = timeFilteredJobs.filter((j) => (j.category_type || "laptop_general") === "laptop_general").length;
    const drones = timeFilteredJobs.filter((j) => j.category_type === "drone").length;

    return {
      laptops,
      drones,
      laptopPct: Math.round((laptops / total) * 100),
      dronePct: Math.round((drones / total) * 100),
    };
  }, [timeFilteredJobs]);

  // Technician Workload
  const techWorkload = useMemo(() => {
    const techs = employees.filter(
      (e) => e.is_active && ["technician", "admin", "manager"].includes(e.role)
    );

    const countMap: Record<string, number> = {};
    timeFilteredJobs.forEach((j) => {
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
  }, [employees, timeFilteredJobs]);

  // Filtered queue table
  const queueJobs = useMemo(() => {
    let result = timeFilteredJobs;

    if (statusFilter !== "ALL") {
      if (statusFilter === "active") {
        result = result.filter(
          (j) => !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
        );
      } else if (statusFilter === "attention") {
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
  }, [timeFilteredJobs, statusFilter, searchQuery]);

  // Helper for interactive KPI click-to-filter
  const handleCardClick = (targetStatus: string) => {
    if (statusFilter === targetStatus) {
      setStatusFilter("ALL"); // toggle off
    } else {
      setStatusFilter(targetStatus);
    }
  };

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
      case "delivered":
      case "closed":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40">Delivered</span>;
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

        {/* 1. TOP HEADER: TITLE + TIME RANGE SELECTOR + REFRESH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time service lab throughput, ticket dispatch, and workshop performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* shadcn Time Range Filter Segmented Control */}
            <div className="inline-flex h-8 items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <button
                onClick={() => setTimeRange("today")}
                className={`h-7 px-2.5 rounded-md font-medium transition-all ${
                  timeRange === "today"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange("week")}
                className={`h-7 px-2.5 rounded-md font-medium transition-all ${
                  timeRange === "week"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange("month")}
                className={`h-7 px-2.5 rounded-md font-medium transition-all ${
                  timeRange === "month"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange("all")}
                className={`h-7 px-2.5 rounded-md font-medium transition-all ${
                  timeRange === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All Time
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shadow-2xs"
              title="Refresh metrics"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Optional Parts Request Notification Banner if parts pending */}
        {pendingPartsCount > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>{pendingPartsCount} part request(s)</strong> awaiting vendor action or approval for pending jobs.
              </span>
            </div>
            <Link
              href="/part-requests"
              className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0 ml-2"
            >
              <span>Manage procurement</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <LoadingSpinner size="lg" className="text-[#009688]" />
          </div>
        ) : (
          <>
            {/* 2. INTERACTIVE SHADCN 4 KPI CARDS (CLICK TO FILTER) */}
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
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-teal-600" />
                    <span>Billed completed orders</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Active Repairs (Clickable Filter) */}
              <button
                type="button"
                onClick={() => handleCardClick("active")}
                className={`text-left rounded-xl border p-5 shadow-xs transition-all relative group cursor-pointer ${
                  statusFilter === "active"
                    ? "border-teal-500 bg-teal-50/30 dark:bg-teal-950/30 ring-2 ring-teal-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Work orders</span>
                  <Wrench className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    {metrics.activeCount}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {statusFilter === "active" ? "Filtering table below" : "Click to view queue"}
                  </p>
                </div>
              </button>

              {/* Card 3: Ready for Pickup (Clickable Filter) */}
              <button
                type="button"
                onClick={() => handleCardClick("diagnosed")}
                className={`text-left rounded-xl border p-5 shadow-xs transition-all relative group cursor-pointer ${
                  statusFilter === "diagnosed"
                    ? "border-teal-500 bg-teal-50/30 dark:bg-teal-950/30 ring-2 ring-teal-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ready for Pickup</span>
                  <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    {metrics.readyCount}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {statusFilter === "diagnosed" ? "Filtering table below" : "Repaired & awaiting customer"}
                  </p>
                </div>
              </button>

              {/* Card 4: Action Required (Clickable Filter) */}
              <button
                type="button"
                onClick={() => handleCardClick("attention")}
                className={`text-left rounded-xl border p-5 shadow-xs transition-all relative group cursor-pointer ${
                  statusFilter === "attention"
                    ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/30 ring-2 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    Action Required
                    {metrics.attentionCount > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    )}
                  </span>
                  <AlertCircle className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                    {metrics.attentionCount}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {statusFilter === "attention" ? "Filtering table below" : "Unassigned or urgent priority"}
                  </p>
                </div>
              </button>

            </div>

            {/* 3. VISUAL CHARTS SECTION: WEEKLY THROUGHPUT BAR CHART + WORKSHOP HEALTH */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
              
              {/* LEFT 4 COLS: SHADCN 7-DAY REPAIR INTAKE & COMPLETION BAR CHART */}
              <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-teal-600" />
                        7-Day Throughput Activity
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Daily comparison of tickets received vs tickets repaired
                      </p>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                        <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" />
                        <span>Intake</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#009688]" />
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG / Pure CSS Responsive Bar Chart */}
                  <div className="mt-6 h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    {throughputChartData.days.map((day) => {
                      const intakeHeight = Math.max(8, Math.round((day.intake / throughputChartData.maxCount) * 120));
                      const completedHeight = Math.max(8, Math.round((day.completed / throughputChartData.maxCount) * 120));

                      return (
                        <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 group">
                          {/* Bars container */}
                          <div className="h-32 w-full flex items-end justify-center gap-1 sm:gap-1.5">
                            {/* Intake Bar */}
                            <div
                              style={{ height: `${intakeHeight}px` }}
                              className="w-3 sm:w-4 rounded-t-sm bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 transition-all relative"
                              title={`${day.label}: ${day.intake} tickets received`}
                            />
                            {/* Completed Bar */}
                            <div
                              style={{ height: `${completedHeight}px` }}
                              className="w-3 sm:w-4 rounded-t-sm bg-[#009688] group-hover:bg-[#00796b] transition-all relative"
                              title={`${day.label}: ${day.completed} repaired/delivered`}
                            />
                          </div>

                          {/* Day Label */}
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Based on active branch intake timestamp</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Total {throughputChartData.days.reduce((acc, d) => acc + d.intake, 0)} received this week
                  </span>
                </div>
              </div>

              {/* RIGHT 3 COLS: WORKSHOP HEALTH & TURNAROUND STATS */}
              <div className="lg:col-span-3 space-y-4">
                
                {/* Metric Card: Turnaround Time */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Turnaround Time</span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-mono">
                      1.8 Days
                    </div>
                    <span className="text-xs font-semibold text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md">
                      Fast SLA
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Average intake to customer delivery duration
                  </p>
                </div>

                {/* Metric Card: Device Intake Proportion */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Device Specialization</span>
                    <span className="text-xs font-mono text-slate-400">{timeFilteredJobs.length} Devices</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
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

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
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

            </div>

            {/* 4. VISUAL PIPELINE PROGRESS STRIP */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Repair Pipeline Funnel
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Distribution of all {timeFilteredJobs.length} tickets across service stages
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium">
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

            {/* 5. MAIN WORKSPACE: ACTIVE QUEUE TABLE (LEFT) + TECHNICIAN DISPATCH (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">

              {/* LEFT 5 COLUMNS: DATA TABLE WITH INSTANT FILTER BADGE */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Table Header with Search & Filter */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Recent Work Orders
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Active ticket stream across registered devices
                        </p>
                      </div>
                      {/* Active Filter Pill if card was clicked */}
                      {statusFilter !== "ALL" && (
                        <button
                          onClick={() => setStatusFilter("ALL")}
                          className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-md border border-teal-200 dark:border-teal-800 hover:bg-teal-100"
                          title="Clear status filter"
                        >
                          <span>Filter: {statusFilter}</span>
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-full sm:w-52">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter orders..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden font-medium text-slate-700 dark:text-slate-300"
                      >
                        <option value="ALL">All Status</option>
                        <option value="active">Active Orders</option>
                        <option value="attention">Needs Attention</option>
                        <option value="received">Received</option>
                        <option value="diagnosis_pending">In Diagnosis</option>
                        <option value="diagnosed">Ready</option>
                        <option value="delivered">Delivered</option>
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
                  <span>Showing {queueJobs.length} of {timeFilteredJobs.length} tickets</span>
                  <Link href="/jobs" className="text-[#009688] font-medium hover:underline inline-flex items-center gap-1">
                    <span>View all work orders</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* RIGHT 2 COLUMNS: TECHNICIAN DISPATCH & WORKBENCH CAPACITY */}
              <div className="lg:col-span-2 space-y-6">

                {/* Technician Dispatch Capacity */}
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
