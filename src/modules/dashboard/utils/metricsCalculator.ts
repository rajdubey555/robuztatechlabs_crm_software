import { RepairJob } from "@/types/job";
import { DashboardMetrics, AttentionMetrics, PipelineCounts } from "../types";

export function calculateDashboardMetrics(jobs: RepairJob[]): DashboardMetrics {
  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter(
    (j) => !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
  ).length;
  const completedJobs = jobs.filter((j) =>
    ["delivered", "closed", "ready_for_delivery"].includes(j.status)
  ).length;

  const revenue = jobs.reduce((acc, j) => {
    const val = Number(j.final_cost || 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return { totalJobs, pendingJobs, completedJobs, revenue };
}

export function calculateAttentionMetrics(jobs: RepairJob[]): AttentionMetrics {
  const urgentJobs = jobs.filter(
    (j) =>
      ["critical", "high"].includes(j.priority) &&
      !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
  );

  const unassignedJobs = jobs.filter(
    (j) =>
      !j.assigned_employee_id &&
      !["delivered", "closed", "cancelled", "unrepairable"].includes(j.status)
  );

  const pendingDiagnosisJobs = jobs.filter(
    (j) =>
      ["received", "diagnosis_pending"].includes(j.status) &&
      !["cancelled", "unrepairable"].includes(j.status)
  );

  const readyForDeliveryJobs = jobs.filter(
    (j) => j.status === "ready_for_delivery" || j.status === "diagnosed"
  );

  return {
    urgentCount: urgentJobs.length,
    unassignedCount: unassignedJobs.length,
    pendingDiagnosisCount: pendingDiagnosisJobs.length,
    readyDeliveryCount: readyForDeliveryJobs.length,
  };
}

export function calculatePipelineCounts(jobs: RepairJob[]): PipelineCounts {
  return {
    received: jobs.filter((j) => j.status === "received").length,
    diagnosis: jobs.filter((j) => j.status === "diagnosis_pending").length,
    diagnosed: jobs.filter((j) => j.status === "diagnosed").length,
    waiting_parts: jobs.filter((j) => j.status === "waiting_parts").length,
    in_progress: jobs.filter((j) => j.status === "in_progress").length,
    ready_for_delivery: jobs.filter((j) => j.status === "ready_for_delivery").length,
    delivered: jobs.filter((j) => j.status === "delivered").length,
    cancelled: jobs.filter((j) => j.status === "cancelled").length,
    unrepairable: jobs.filter((j) => j.status === "unrepairable").length,
  };
}
