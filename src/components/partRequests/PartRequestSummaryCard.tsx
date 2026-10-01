import React from "react";
import { Card, CardContent } from "@/components/ui";
import { PartRequest } from "@/types/partRequest";

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
    <Card className="shadow-xs border-l-4 border-l-[#009688]">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔩</span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Part Requests Overview
              </h3>
              <span className="text-xs text-slate-500">
                Spare part procurement status for this job
              </span>
            </div>
          </div>

          <button
            onClick={onRequestNew}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#009688] text-white hover:bg-[#00796b] shadow-xs transition-all"
          >
            + New Request
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Requests
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
              {totalCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Active / Pending
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
              {pendingCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Received
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {receivedCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
