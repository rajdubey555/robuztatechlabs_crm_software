import { JobStatus } from "@/types/job";
import { Badge } from "@/components/ui";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const statusConfig: Record<
    JobStatus,
    { label: string; variant: "primary" | "warning" | "error" | "default" | "success" | "info" }
  > = {
    received: { label: "Received", variant: "info" },
    diagnosis_pending: { label: "Pending Assessment", variant: "warning" },
    diagnosed: { label: "Ready for Repair", variant: "primary" },
    cancelled: { label: "Cancelled", variant: "default" },
    unrepairable: { label: "Unrepairable", variant: "error" },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: "default",
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
