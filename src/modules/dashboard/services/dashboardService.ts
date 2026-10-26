import { createClient } from "@/lib/supabase/client";
import { RepairJob } from "@/types/job";
import { Customer } from "@/types/customer";
import { Device } from "@/types/device";
import { Employee } from "@/types/employee";
import { Diagnosis } from "@/types/diagnosis";
import { DashboardData } from "../types";

/**
 * Fetch all data required for the executive dashboard in parallel (Server or Client)
 */
export async function getDashboardData(client?: any): Promise<{ data: DashboardData; error: string | null }> {
  const supabase = client || createClient();
  try {
    const [jobsRes, empRes, diagRes, partsRes] = await Promise.all([
      // 1. Repair jobs with customer, device & technician (Recent 200 for lightning-fast metrics)
      supabase
        .from("repair_jobs")
        .select(`
          *,
          customer:customers(id, customer_code, full_name, phone),
          device:devices(id, device_code, brand, model, device_type),
          assigned_employee:employees!repair_jobs_assigned_employee_id_fkey(id, employee_code, full_name, role)
        `)
        .order("created_at", { ascending: false })
        .limit(200),

      // 2. Active Employees
      supabase
        .from("employees")
        .select("id, employee_code, full_name, role, specialization, is_active")
        .order("full_name", { ascending: true }),

      // 3. Recent Diagnoses
      supabase
        .from("diagnoses")
        .select(`
          *,
          employee:employees(id, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(5),

      // 4. Recent Part Requests
      supabase
        .from("part_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (jobsRes.error) throw jobsRes.error;

    return {
      data: {
        jobs: (jobsRes.data as unknown as RepairJob[]) || [],
        customers: [],
        devices: [],
        employees: (empRes.data as Employee[]) || [],
        recentDiagnoses: (diagRes.data as unknown as Diagnosis[]) || [],
        partRequests: (partsRes.data as unknown as any[]) || [],
      },
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load dashboard data.";
    return {
      data: {
        jobs: [],
        customers: [],
        devices: [],
        employees: [],
        recentDiagnoses: [],
        partRequests: [],
      },
      error: msg,
    };
  }
}
