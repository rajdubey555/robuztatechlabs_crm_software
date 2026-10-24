import { JobStatus } from "@/types/job";
import { Badge } from "@/components/ui";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const statusConfig: Record<
    JobStatus,
    { label: string; variant: "primary" | "warning" | "error" | "default" | "success" | "info" }
  > = {
    received: { label: "Received", variant: "info" },
    diagnosis_pending: { label: "In Diagnosis", variant: "warning" },
    diagnosed: { label: "Diagnosed", variant: "primary" },
    waiting_parts: { label: "Waiting for Parts", variant: "warning" },
    in_progress: { label: "Under Repair", variant: "info" },
    ready_for_delivery: { label: "Ready for Pickup", variant: "success" },
    delivered: { label: "Delivered", variant: "default" },
    cancelled: { label: "Cancelled", variant: "default" },
    unrepairable: { label: "Unrepairable", variant: "error" },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: "default",
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
