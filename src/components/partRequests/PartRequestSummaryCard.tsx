import React from "react";
import { Card, CardContent } from "@/components/ui";
import { PartRequest } from "@/types/partRequest";
import { Package, Plus } from "lucide-react";

export interface PartRequestSummaryCardProps {
  requests: PartRequest[];
  onRequestNew: () => void;
}

export function PartRequestSummaryCard({
  requests,
  onRequestNew,
}: PartRequestSummaryCardProps) {
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) =>
    ["PENDING", "ORDERED"].includes(r.status)
  ).length;
  const receivedCount = requests.filter((r) => r.status === "RECEIVED").length;

  return (
    <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Part Requests Overview
              </h3>
              <span className="text-xs text-slate-500">
                Procurement status for this job
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onRequestNew}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#009688] text-white hover:bg-[#00796b] shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Request
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block font-mono">
              {totalCount}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Active
            </span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5 block font-mono">
              {pendingCount}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Received
            </span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block font-mono">
              {receivedCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
