import { JobPriority } from "@/types/job";
import { Badge } from "@/components/ui";

export function JobPriorityBadge({ priority }: { priority: JobPriority }) {
  const priorityConfig: Record<
    JobPriority,
    { label: string; variant: "error" | "warning" | "info" | "default" }
  > = {
    critical: { label: "Critical", variant: "error" },
    high: { label: "High", variant: "warning" },
    medium: { label: "Medium", variant: "info" },
    low: { label: "Low", variant: "default" },
  };

  const config = priorityConfig[priority] || {
    label: priority,
    variant: "default",
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
