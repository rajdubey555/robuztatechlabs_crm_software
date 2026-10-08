import { Employee, JobAssignment } from "./employee";
import { Diagnosis } from "./diagnosis";

export type JobPriority = "critical" | "high" | "medium" | "low";

export type JobStatus =
  | "received"
  | "diagnosis_pending"
  | "diagnosed"
  | "cancelled"
  | "unrepairable";

export interface RepairJob {
  id: string;
  job_code: string;
  customer_id: string;
  device_id: string;
  assigned_employee_id?: string | null;
  branch?: "south_bopal" | "tragad";
  category_type?: "laptop_general" | "drone";
  customer_complaint: string;
  priority: JobPriority;
  status: JobStatus;
  estimated_cost?: number | null;
  final_cost?: number | null;
  received_at: string;
  expected_delivery_at?: string | null;
  completed_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;

  customer?: {
    id: string;
    customer_code: string;
    full_name: string;
    phone: string;
  };
  device?: {
    id: string;
    device_code: string;
    device_type: string;
    brand: string;
    model: string;
    serial_number?: string | null;
    imei?: string | null;
  };
  assigned_employee?: Employee | null;
  assignments?: JobAssignment[];
  diagnoses?: Diagnosis[];
  latest_diagnosis?: Diagnosis | null;
}

export interface RepairJobFormData {
  customer_id: string;
  device_id: string;
  branch?: "south_bopal" | "tragad";
  category_type?: "laptop_general" | "drone";
  customer_complaint: string;
  priority: JobPriority;
  estimated_cost?: number | string;
  final_cost?: number | string;
  expected_delivery_at?: string;
}

export interface RepairJobFormErrors {
  customer_id?: string;
  device_id?: string;
  customer_complaint?: string;
  priority?: string;
  estimated_cost?: string;
  final_cost?: string;
  expected_delivery_at?: string;
}
