import { Employee } from "./employee";

export interface Diagnosis {
  id: string;
  repair_job_id: string;
  employee_id?: string | null;
  diagnosis: string;
  recommended_action?: string | null;
  estimated_cost?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee | null;
}

export interface DiagnosisFormData {
  diagnosis: string;
  recommended_action?: string;
  estimated_cost?: number | string;
  notes?: string;
}

export interface DiagnosisFormErrors {
  diagnosis?: string;
  estimated_cost?: string;
}
