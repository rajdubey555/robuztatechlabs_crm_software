import { RepairJob } from "@/types/job";
import { Customer } from "@/types/customer";
import { Device } from "@/types/device";
import { Employee } from "@/types/employee";
import { Diagnosis } from "@/types/diagnosis";
import { PartRequest } from "@/types/partRequest";

export interface ActivityItem {
  id: string;
  type: "job" | "assignment" | "diagnosis";
  title: string;
  description: string;
  timestamp: string;
  link: string;
}

export interface DashboardMetrics {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  revenue: number;
}

export interface AttentionMetrics {
  urgentCount: number;
  unassignedCount: number;
  pendingDiagnosisCount: number;
  readyDeliveryCount: number;
}

export interface PipelineCounts {
  received: number;
  diagnosis: number;
  diagnosed: number;
  waiting_parts?: number;
  in_progress?: number;
  ready_for_delivery?: number;
  delivered?: number;
  cancelled: number;
  unrepairable: number;
}

export interface DashboardData {
  jobs: RepairJob[];
  customers: Customer[];
  devices: Device[];
  employees: Employee[];
  recentDiagnoses: Diagnosis[];
  partRequests: PartRequest[];
}

