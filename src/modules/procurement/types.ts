export * from "@/types/vendor";
export * from "@/types/partRequest";

export interface ProcurementStats {
  totalRequests: number;
  pendingRequests: number;
  orderedRequests: number;
  urgentRequests: number;
}
