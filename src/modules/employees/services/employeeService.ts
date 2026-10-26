import { createClient } from "@/lib/supabase/client";
import { Employee, EmployeeFormData } from "@/types/employee";
import { RepairJob } from "@/types/job";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Fetch all employees ordered by created_at DESC
 */
export async function getEmployees(client?: any): Promise<{ data: Employee[]; error: string | null }> {
  const supabase = client || createClient();
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as Employee[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load employees.";
    return { data: [], error: msg };
  }
}

/**
 * Fetch employees with calculated active repair job workloads (Server or Client)
 */
export async function getEmployeesWithWorkload(client?: any): Promise<{ data: Employee[]; error: string | null }> {
  const supabase = client || createClient();
  try {
    // 1. Fetch employees
    const { data: empData, error: empError } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (empError) throw empError;

    if (!empData || empData.length === 0) {
      return { data: [], error: null };
    }

    // 2. Fetch active repair jobs to compute workload
    const { data: activeJobsData } = await supabase
      .from("repair_jobs")
      .select("assigned_employee_id")
      .not("assigned_employee_id", "is", null)
      .not("status", "in", '("delivered","closed","cancelled","unrepairable")');

    const workloadMap: Record<string, number> = {};
    activeJobsData?.forEach((j: { assigned_employee_id: string | null }) => {
      if (j.assigned_employee_id) {
        workloadMap[j.assigned_employee_id] = (workloadMap[j.assigned_employee_id] || 0) + 1;
      }
    });

    const enrichedEmployees = (empData as Employee[]).map((emp) => ({
      ...emp,
      active_job_count: workloadMap[emp.id] || 0,
    }));

    return { data: enrichedEmployees, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load employees with workload.";
    return { data: [], error: msg };
  }
}

/**
 * Fetch a single employee by ID with assignment history
 */
export async function getEmployeeById(id: string): Promise<{ data: Employee | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Employee, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load employee.";
    return { data: null, error: msg };
  }
}

/**
 * Fetch repair jobs assigned to a specific employee
 */
export async function getEmployeeAssignedJobs(employeeId: string): Promise<{ data: RepairJob[]; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("repair_jobs")
      .select(`
        *,
        customer:customers(id, customer_code, full_name, phone),
        device:devices(id, device_code, device_type, brand, model)
      `)
      .eq("assigned_employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as RepairJob[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load assigned jobs.";
    return { data: [], error: msg };
  }
}

/**
 * Create a new employee profile and auto-generate auth login credentials if email and password provided
 */
export async function createEmployee(
  formData: EmployeeFormData
): Promise<{ data: Employee | null; error: string | null }> {
  const supabase = createClient();
  try {
    // 1. Create Supabase Auth User if Email and Password are provided
    if (formData.email && formData.password) {
      const secondaryAuth = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-crm.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key",
        { auth: { persistSession: false } }
      );

      const { error: authError } = await secondaryAuth.auth.signUp({
        email: formData.email.trim(),
        password: formData.password.trim(),
        options: {
          data: {
            full_name: formData.full_name.trim(),
            role: formData.role,
          },
        },
      });

      if (authError && !authError.message.includes("already registered")) {
        console.warn("Notice during auth user signup:", authError.message);
      }
    }

    // 2. Insert into employees DB table
    const payload = {
      full_name: formData.full_name.trim(),
      display_name: formData.display_name?.trim() || null,
      phone: formData.phone?.trim() || null,
      alternate_phone: formData.alternate_phone?.trim() || null,
      email: formData.email?.trim() || null,
      id_number: formData.id_number?.trim() || null,
      gender: formData.gender || null,
      dob: formData.dob || null,
      role: formData.role,
      specialization: formData.specialization || null,
      branch: formData.branch || "south_bopal",
      category_type: formData.category_type || (formData.specialization === "drone" ? "drone" : "laptop_general"),
      is_active: formData.is_active,
      address_line: formData.address_line?.trim() || null,
      region_state: formData.region_state?.trim() || null,
      city_town: formData.city_town?.trim() || null,
      postal_code: formData.postal_code?.trim() || null,
      bank_account_name: formData.bank_account_name?.trim() || null,
      bank_name: formData.bank_name?.trim() || null,
      bank_branch: formData.bank_branch?.trim() || null,
      bank_account_number: formData.bank_account_number?.trim() || null,
      bank_ifsc: formData.bank_ifsc?.trim() || null,
    };

    const { data, error: insertError } = await supabase
      .from("employees")
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }
    return { data: data as Employee, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create employee.";
    return { data: null, error: msg };
  }
}

/**
 * Update an existing employee profile
 */
export async function updateEmployee(
  id: string,
  formData: Partial<EmployeeFormData>
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const payload: Record<string, unknown> = {};
    if (formData.full_name !== undefined) payload.full_name = formData.full_name.trim();
    if (formData.display_name !== undefined) payload.display_name = formData.display_name?.trim() || null;
    if (formData.phone !== undefined) payload.phone = formData.phone?.trim() || null;
    if (formData.alternate_phone !== undefined) payload.alternate_phone = formData.alternate_phone?.trim() || null;
    if (formData.email !== undefined) payload.email = formData.email?.trim() || null;
    if (formData.id_number !== undefined) payload.id_number = formData.id_number?.trim() || null;
    if (formData.gender !== undefined) payload.gender = formData.gender || null;
    if (formData.dob !== undefined) payload.dob = formData.dob || null;
    if (formData.role !== undefined) payload.role = formData.role;
    if (formData.specialization !== undefined) payload.specialization = formData.specialization || null;
    if (formData.branch !== undefined) payload.branch = formData.branch || "south_bopal";
    if (formData.category_type !== undefined) payload.category_type = formData.category_type;
    if (formData.is_active !== undefined) payload.is_active = formData.is_active;
    if (formData.address_line !== undefined) payload.address_line = formData.address_line?.trim() || null;
    if (formData.region_state !== undefined) payload.region_state = formData.region_state?.trim() || null;
    if (formData.city_town !== undefined) payload.city_town = formData.city_town?.trim() || null;
    if (formData.postal_code !== undefined) payload.postal_code = formData.postal_code?.trim() || null;
    if (formData.bank_account_name !== undefined) payload.bank_account_name = formData.bank_account_name?.trim() || null;
    if (formData.bank_name !== undefined) payload.bank_name = formData.bank_name?.trim() || null;
    if (formData.bank_branch !== undefined) payload.bank_branch = formData.bank_branch?.trim() || null;
    if (formData.bank_account_number !== undefined) payload.bank_account_number = formData.bank_account_number?.trim() || null;
    if (formData.bank_ifsc !== undefined) payload.bank_ifsc = formData.bank_ifsc?.trim() || null;

    const { error } = await supabase
      .from("employees")
      .update(payload)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update employee.";
    return { success: false, error: msg };
  }
}
