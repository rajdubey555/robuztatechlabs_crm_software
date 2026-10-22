import { createClient } from "@/lib/supabase/client";
import { RepairJob } from "@/types/job";
import { Customer } from "@/types/customer";
import { Device } from "@/types/device";
import { Employee } from "@/types/employee";
import { Diagnosis } from "@/types/diagnosis";
import { DashboardData } from "../types";

/**
 * Fetch all data required for the executive dashboard in parallel
 */
export async function getDashboardData(): Promise<{ data: DashboardData; error: string | null }> {
  const supabase = createClient();
  try {
    const [jobsRes, custRes, devRes, empRes, diagRes] = await Promise.all([
      // 1. Repair jobs with customer, device & technician
      supabase
        .from("repair_jobs")
        .select(`
          *,
          customer:customers(id, customer_code, full_name, phone),
          device:devices(id, device_code, brand, model, device_type),
          assigned_employee:employees!repair_jobs_assigned_employee_id_fkey(id, employee_code, full_name, role)
        `)
        .order("created_at", { ascending: false }),

      // 2. Customers
      supabase.from("customers").select("*"),

      // 3. Devices
      supabase.from("devices").select("*"),

      // 4. Employees
      supabase.from("employees").select("*"),

      // 5. Recent Diagnoses
      supabase
        .from("diagnoses")
        .select(`
          *,
          employee:employees(id, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (jobsRes.error) throw jobsRes.error;

    return {
      data: {
        jobs: (jobsRes.data as unknown as RepairJob[]) || [],
        customers: (custRes.data as Customer[]) || [],
        devices: (devRes.data as Device[]) || [],
        employees: (empRes.data as Employee[]) || [],
        recentDiagnoses: (diagRes.data as unknown as Diagnosis[]) || [],
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
      },
      error: msg,
    };
  }
}
