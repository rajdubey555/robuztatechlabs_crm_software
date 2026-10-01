import React from "react";
import { Badge } from "@/components/ui";
import { PartRequestStatus, PartRequestPriority } from "@/types/partRequest";

export interface PartRequestStatusBadgeProps {
  status: PartRequestStatus | string;
}

export function PartRequestStatusBadge({ status }: PartRequestStatusBadgeProps) {
  const s = status?.toString()?.toUpperCase();
  if (s === "PENDING" || s === "REQUESTED") {
    return <Badge variant="warning">⏳ Pending</Badge>;
  }
  if (s === "ORDERED" || s === "AVAILABLE" || s === "READY") {
    return <Badge variant="primary">📦 Ordered</Badge>;
  }
  if (s === "RECEIVED") {
    return <Badge variant="success">✅ Received</Badge>;
  }
  if (s === "CANCELLED" || s === "NOT_AVAILABLE") {
    return <Badge variant="default">🚫 Cancelled</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
}

export interface PartRequestPriorityBadgeProps {
  priority: PartRequestPriority | string;
}

export function PartRequestPriorityBadge({ priority }: PartRequestPriorityBadgeProps) {
  const p = priority?.toString()?.toUpperCase();
  if (p === "URGENT") {
    return <Badge variant="error" className="animate-pulse">🚨 URGENT</Badge>;
  }
  return <Badge variant="default">Normal</Badge>;
}
