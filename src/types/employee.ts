export type EmployeeRole =
  | "admin"
  | "manager"
  | "reception"
  | "technician"
  | "purchase"
  | "accountant";

export type EmployeeSpecialization =
  | "laptop"
  | "mobile"
  | "apple"
  | "hardware"
  | "software"
  | "general";

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  display_name?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  email?: string | null;
  id_number?: string | null;
  gender?: string | null;
  dob?: string | null;
  role: EmployeeRole;
  specialization?: EmployeeSpecialization | null;
  is_active: boolean;
  address_line?: string | null;
  region_state?: string | null;
  city_town?: string | null;
  postal_code?: string | null;
  bank_account_name?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  created_at: string;
  updated_at: string;
  active_job_count?: number;
  total_job_count?: number;
}

export interface EmployeeFormData {
  full_name: string;
  display_name?: string;
  phone?: string;
  alternate_phone?: string;
  email?: string;
  id_number?: string;
  gender?: string;
  dob?: string;
  role: EmployeeRole;
  specialization?: EmployeeSpecialization;
  is_active: boolean;
  address_line?: string;
  region_state?: string;
  city_town?: string;
  postal_code?: string;
  bank_account_name?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
}

export interface EmployeeFormErrors {
  full_name?: string;
  phone?: string;
  email?: string;
  role?: string;
}

export interface JobAssignment {
  id: string;
  repair_job_id: string;
  employee_id: string;
  assigned_by?: string | null;
  assigned_at: string;
  unassigned_at?: string | null;
  notes?: string | null;
  created_at: string;
  employee?: Employee;
}
