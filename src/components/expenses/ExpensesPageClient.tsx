"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Expense,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  getExpenses,
  deleteExpense,
} from "@/modules/expenses";
import { ExpenseModal } from "./ExpenseModal";
import { Modal, Button } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import { AppShell } from "@/components/layout/AppShell";
import {
  Receipt,
  Plus,
  Search,
  RefreshCw,
  Download,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  CreditCard,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  ExternalLink,
  Wallet,
  PiggyBank,
  CircleDot,
  CheckCircle2,
  X,
  Eye,
} from "lucide-react";

interface ExpensesPageClientProps {
  initialExpenses?: Expense[];
  vendors?: { id: string; name: string }[];
  userEmail?: string;
  serviceRevenue?: number;
}

export function ExpensesPageClient({
  initialExpenses = [],
  vendors = [],
  userEmail,
  serviceRevenue = 0,
}: ExpensesPageClientProps) {
  const { selectedBranch, activeBranchInfo, isFiltered, clearFilters } = useBranchContext();

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [timeRangeFilter, setTimeRangeFilter] = useState<"all" | "today" | "month" | "last_month">("month");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [viewingReceiptExpense, setViewingReceiptExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isReceiptImage = (url?: string | null): boolean => {
    if (!url) return false;
    return url.startsWith("http") || url.startsWith("data:image") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(url);
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await getExpenses();
      if (res.error) throw new Error(res.error);
      setExpenses(res.data);
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenAdd = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteExpense(expenseToDelete.id);
      if (res.error) {
        alert("Failed to delete expense: " + res.error);
      } else {
        setExpenseToDelete(null);
        fetchExpenses();
      }
    } catch {
      alert("Error occurred while deleting expense.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayStr = now.toISOString().slice(0, 10);

    return expenses.filter((item) => {
      // 1. Global topbar branch filter
      if (selectedBranch !== "all") {
        if (item.branch !== "both" && item.branch !== selectedBranch) return false;
      }

      // 2. Local branch dropdown filter
      if (branchFilter !== "ALL" && item.branch !== branchFilter) return false;

      // 3. Category filter
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;

      // 4. Payment method filter
      if (paymentMethodFilter !== "ALL" && item.payment_method !== paymentMethodFilter) return false;

      // 5. Time range filter
      if (item.expense_date) {
        const itemDate = new Date(item.expense_date);
        if (timeRangeFilter === "today") {
          if (item.expense_date !== todayStr) return false;
        } else if (timeRangeFilter === "month") {
          if (itemDate.getFullYear() !== currentYear || itemDate.getMonth() !== currentMonth) {
            return false;
          }
        } else if (timeRangeFilter === "last_month") {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (itemDate.getFullYear() !== lastMonthYear || itemDate.getMonth() !== lastMonth) {
            return false;
          }
        }
      }

      // 6. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesPaidTo = item.paid_to?.toLowerCase().includes(q) || false;
        const matchesNotes = item.notes?.toLowerCase().includes(q) || false;
        const matchesVendor = item.vendor?.name.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesPaidTo && !matchesNotes && !matchesVendor) return false;
      }

      return true;
    });
  }, [
    expenses,
    selectedBranch,
    branchFilter,
    categoryFilter,
    paymentMethodFilter,
    timeRangeFilter,
    searchQuery,
  ]);

  // Financial Metrics Calculation
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const bopalExpenseAmount = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.branch === "south_bopal")
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const tragadExpenseAmount = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.branch === "tragad")
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  // Net Operating Profit (Revenue minus Expenses)
  const netOperatingProfit = serviceRevenue - totalExpenseAmount;
  const isProfitable = netOperatingProfit >= 0;

  // Category distribution
  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + (Number(item.amount) || 0);
    });

    return Object.entries(map)
      .map(([catKey, total]) => ({
        key: catKey as ExpenseCategory,
        meta: EXPENSE_CATEGORIES[catKey as ExpenseCategory] || EXPENSE_CATEGORIES.other,
        total,
        percentage: totalExpenseAmount > 0 ? Math.round((total / totalExpenseAmount) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, totalExpenseAmount]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;
    const headers = [
      "Date",
      "Expense Title",
      "Category",
      "Branch",
      "Amount (INR)",
      "Payment Method",
      "Paid To",
      "Notes",
    ];

    const rows = filteredExpenses.map((e) => [
      `"${e.expense_date}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${EXPENSE_CATEGORIES[e.category]?.label || e.category}"`,
      `"${e.branch === "south_bopal" ? "South Bopal" : e.branch === "tragad" ? "Tragad" : "Central/Both"}"`,
      `"${e.amount}"`,
      `"${e.payment_method.toUpperCase()}"`,
      `"${(e.paid_to || "").replace(/"/g, '""')}"`,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `robuzta_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatINR = (val: number) => {
    return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="w-full space-y-4">

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688] shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Expenses & Financial Health
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {filteredExpenses.length} entries
                </span>
                {activeBranchInfo && (
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    • {activeBranchInfo.shortName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track shop utility bills, spare parts purchases, lab consumables, salaries, and operating burn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* View Mode Switcher */}
            <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-800 text-[#009688] shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-800 text-[#009688] shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExpenses}
              disabled={loading}
              className="h-9 w-9 p-0 shrink-0"
              title="Refresh expense entries"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#009688]" : "text-slate-500"}`} />
            </Button>

            {/* Export CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredExpenses.length === 0}
              className="h-9 px-3 text-xs shrink-0"
              title="Export list as CSV"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Export
            </Button>

            {/* Add Expense Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              className="h-9 px-3.5 text-xs font-semibold shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Global Context Filter Banner */}
        {isFiltered && (
          <div className="flex items-center justify-between bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-xl px-4 py-2 text-xs text-teal-900 dark:text-teal-200 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-teal-700 dark:text-teal-400">Context Filter:</span>
              {selectedBranch !== "all" && (
                <span className="bg-white dark:bg-teal-900 font-medium px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 text-slate-800 dark:text-slate-200">
                  {activeBranchInfo?.name || selectedBranch}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-xs text-teal-700 dark:text-teal-300 hover:underline font-semibold cursor-pointer"
            >
              Reset Context
            </button>
          </div>
        )}

        {/* Executive Financial KPIs Overview (4 Cards Spanning Full Width) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {/* Card 1: Total Expenses */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Total Expenditure</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
              {formatINR(totalExpenseAmount)}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span>Across {filteredExpenses.length} transactions</span>
            </div>
          </div>

          {/* Card 2: Service Labor Revenue */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Billed Job Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
              {formatINR(serviceRevenue)}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Invoiced customer orders</span>
            </div>
          </div>

          {/* Card 3: Net Operating Profit */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Net Operating Profit</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isProfitable ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" : "bg-rose-50 dark:bg-rose-950/40 text-rose-600"}`}>
                <PiggyBank className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className={`text-xl font-bold font-mono mt-1.5 ${isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {isProfitable ? "+" : ""}{formatINR(netOperatingProfit)}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-medium mt-0.5">
              {isProfitable ? (
                <span className="text-emerald-600 dark:text-emerald-400">Net Surplus (Munafa)</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400">Operating Deficit</span>
              )}
            </div>
          </div>

          {/* Card 4: Branch Split */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Branch Expenditure Split</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">South Bopal:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatINR(bopalExpenseAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">Tragad:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatINR(tragadExpenseAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Chips / Filter Bar */}
        {categorySummary.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Expenditure by Category (Click to Filter):
              </span>
              {categoryFilter !== "ALL" && (
                <button
                  onClick={() => setCategoryFilter("ALL")}
                  className="inline-flex items-center gap-1 text-[11px] text-[#009688] hover:underline font-semibold cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Clear Category Filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {categorySummary.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setCategoryFilter((prev) => (prev === item.key ? "ALL" : item.key))
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    categoryFilter === item.key
                      ? "ring-2 ring-[#009688] shadow-xs " + item.meta.bgColor + " " + item.meta.color + " " + item.meta.borderColor
                      : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <span>{item.meta.label}</span>
                  <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                    {formatINR(item.total)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({item.percentage}%)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full-Width Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center gap-2.5 w-full">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search expenses by title, recipient, notes, or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            {/* Timeframe Filter */}
            <select
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value as "all" | "today" | "month" | "last_month")}
              className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            >
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="today">Today</option>
              <option value="all">All Time</option>
            </select>

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            >
              <option value="ALL">All Branches</option>
              <option value="south_bopal">South Bopal</option>
              <option value="tragad">Tragad</option>
              <option value="both">Both / Central</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#009688]"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Net Banking</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Expenses List: Table or Grid */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-3 shadow-2xs w-full">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No Expense Entries Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No expenditure matches your active search or timeframe filter.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              className="mt-2"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Log First Expense
            </Button>
          </div>
        ) : viewMode === "table" ? (
          /* Table View spanning full width */
          <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 pl-4 pr-3 whitespace-nowrap">Date</th>
                  <th className="py-3.5 px-3">Expense Title / Payee</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Branch</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Amount</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Payment Mode</th>
                  <th className="py-3.5 px-3">Receipt / Notes</th>
                  <th className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredExpenses.map((expense) => {
                  const catMeta = EXPENSE_CATEGORIES[expense.category] || EXPENSE_CATEGORIES.other;
                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3 pl-4 pr-3 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-300">
                        {expense.expense_date}
                      </td>

                      {/* Title & Payee */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {expense.title}
                          </span>
                          {expense.paid_to && (
                            <span className="text-[11px] text-slate-400">
                              Paid to: <strong className="text-slate-600 dark:text-slate-300">{expense.paid_to}</strong>
                            </span>
                          )}
                          {expense.vendor && (
                            <span className="text-[10px] text-[#009688]">
                              Vendor: {expense.vendor.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border ${catMeta.bgColor} ${catMeta.color} ${catMeta.borderColor}`}
                        >
                          {catMeta.label}
                        </span>
                      </td>

                      {/* Branch Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {expense.branch === "south_bopal"
                            ? "South Bopal"
                            : expense.branch === "tragad"
                            ? "Tragad"
                            : "Central / Both"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {formatINR(expense.amount)}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span className="uppercase">{expense.payment_method.replace("_", " ")}</span>
                        </span>
                      </td>

                      {/* Receipt & Notes */}
                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          {expense.receipt_url && (
                            isReceiptImage(expense.receipt_url) ? (
                              <button
                                type="button"
                                onClick={() => setViewingReceiptExpense(expense)}
                                className="relative group w-8 h-8 rounded-lg overflow-hidden border border-teal-200 dark:border-teal-900 bg-slate-100 dark:bg-slate-800 hover:ring-2 hover:ring-[#009688] transition-all shrink-0 cursor-pointer"
                                title="Click to view payment slip"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={expense.receipt_url}
                                  alt="Receipt"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                <Receipt className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[110px]">{expense.receipt_url}</span>
                              </span>
                            )
                          )}
                          {expense.notes && (
                            <span className="truncate max-w-[150px] text-slate-400" title={expense.notes}>
                              {expense.notes}
                            </span>
                          )}
                          {!expense.receipt_url && !expense.notes && "—"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-4 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(expense)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(expense)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View spanning full width */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {filteredExpenses.map((expense) => {
              const catMeta = EXPENSE_CATEGORIES[expense.category] || EXPENSE_CATEGORIES.other;
              return (
                <div
                  key={expense.id}
                  className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md border ${catMeta.bgColor} ${catMeta.color} ${catMeta.borderColor}`}
                      >
                        {catMeta.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {expense.expense_date}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {expense.title}
                      </h3>
                      {expense.paid_to && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Paid to: <span className="font-medium text-slate-700 dark:text-slate-200">{expense.paid_to}</span>
                        </p>
                      )}
                    </div>

                    {expense.receipt_url && isReceiptImage(expense.receipt_url) && (
                      <button
                        type="button"
                        onClick={() => setViewingReceiptExpense(expense)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#009688] hover:underline pt-0.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Payment Slip / Bill
                      </button>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                        {formatINR(expense.amount)}
                      </span>
                      <span className="text-[11px] uppercase font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {expense.payment_method}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {expense.branch === "south_bopal"
                        ? "South Bopal"
                        : expense.branch === "tragad"
                        ? "Tragad"
                        : "Central"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(expense)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(expense)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Expense Modal */}
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          expenseToEdit={expenseToEdit}
          onSuccess={fetchExpenses}
          vendors={vendors}
        />

        {/* Delete Confirmation Modal */}
        {expenseToDelete && (
          <Modal
            isOpen={Boolean(expenseToDelete)}
            onClose={() => setExpenseToDelete(null)}
            title="Delete Expense Entry"
            maxWidth="md"
          >
            <div className="space-y-4 pt-1">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to delete this expense record for{" "}
                <strong className="text-slate-900 dark:text-white">{expenseToDelete.title}</strong> (
                {formatINR(expenseToDelete.amount)})?
              </p>
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                This transaction will be permanently removed from financial reports.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpenseToDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={deleting}
                  onClick={handleDelete}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Receipt Image Lightbox Modal */}
        {viewingReceiptExpense && (
          <Modal
            isOpen={Boolean(viewingReceiptExpense)}
            onClose={() => setViewingReceiptExpense(null)}
            title="Payment Receipt / Bill Proof"
            description={`${viewingReceiptExpense.title} • ${formatINR(viewingReceiptExpense.amount)}`}
            maxWidth="2xl"
          >
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[70vh] border border-slate-800 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingReceiptExpense.receipt_url || ""}
                  alt="Payment Receipt"
                  className="max-h-[66vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Payment Summary</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatINR(viewingReceiptExpense.amount)} via {viewingReceiptExpense.payment_method.toUpperCase()} • {viewingReceiptExpense.expense_date}
                  </p>
                  {viewingReceiptExpense.paid_to && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Paid to: {viewingReceiptExpense.paid_to}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {viewingReceiptExpense.receipt_url?.startsWith("http") && (
                    <a
                      href={viewingReceiptExpense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#009688] hover:bg-[#00897b] text-white font-medium text-xs shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Full Size
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingReceiptExpense(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </AppShell>
  );
}
