import { createClient } from "@/lib/supabase/client";
import { Customer, CustomerFormData } from "@/types/customer";
import { Device } from "@/types/device";
import { RepairJob } from "@/types/job";

export interface CustomerHistoryResult {
  customer: Customer | null;
  devices: Device[];
  jobs: RepairJob[];
  error?: string | null;
}

/**
 * Fetch all customers ordered by created_at DESC (Server or Client)
 */
export async function getCustomers(client?: any): Promise<{ data: Customer[]; error: string | null }> {
  const supabase = client || createClient();
  try {
    // 1. Try enriched fetch with related devices and jobs counts
    const { data: enrichedData, error: enrichedError } = await supabase
      .from("customers")
      .select(`
        *,
        devices(id),
        repair_jobs(id, status)
      `)
      .order("created_at", { ascending: false });

    if (!enrichedError && enrichedData) {
      const formatted = enrichedData.map((c: any) => ({
        ...c,
        devices_count: Array.isArray(c.devices) ? c.devices.length : 0,
        active_jobs_count: Array.isArray(c.repair_jobs)
          ? c.repair_jobs.filter(
              (j: any) => !["delivered", "cancelled"].includes(j.status?.toLowerCase() || "")
            ).length
          : 0,
      }));
      return { data: formatted as Customer[], error: null };
    }

    // 2. Fallback to basic fetch if relations query is restricted
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as Customer[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch customers.";
    return { data: [], error: msg };
  }
}

/**
 * Fetch a single customer by ID
 */
export async function getCustomerById(id: string): Promise<{ data: Customer | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Customer, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch customer.";
    return { data: null, error: msg };
  }
}

/**
 * Fetch customer with related registered devices and repair jobs
 */
export async function getCustomerWithHistory(id: string): Promise<CustomerHistoryResult> {
  const supabase = createClient();
  try {
    // 1. Fetch customer
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (custErr || !customer) {
      return { customer: null, devices: [], jobs: [], error: custErr?.message || "Customer not found." };
    }

    // 2. Fetch devices
    const { data: devices } = await supabase
      .from("devices")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    // 3. Fetch jobs
    const { data: jobs } = await supabase
      .from("repair_jobs")
      .select(`
        *,
        device:devices (
          id,
          device_code,
          device_type,
          brand,
          model
        )
      `)
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    return {
      customer: customer as Customer,
      devices: (devices as Device[]) || [],
      jobs: (jobs as unknown as RepairJob[]) || [],
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load customer profile.";
    return { customer: null, devices: [], jobs: [], error: msg };
  }
}

/**
 * Create a new customer profile
 */
export async function createCustomer(formData: CustomerFormData): Promise<{ data: Customer | null; error: string | null }> {
  const supabase = createClient();
  try {
    const payload = {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      alternate_phone: formData.alternate_phone?.trim() || null,
      email: formData.email?.trim() || null,
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      branch: formData.branch || null,
      notes: formData.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from("customers")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Customer, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create customer.";
    return { data: null, error: msg };
  }
}

/**
 * Update an existing customer profile
 */
export async function updateCustomer(id: string, formData: Partial<CustomerFormData>): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const payload: Record<string, unknown> = {};
    if (formData.full_name !== undefined) payload.full_name = formData.full_name.trim();
    if (formData.phone !== undefined) payload.phone = formData.phone.trim();
    if (formData.alternate_phone !== undefined) payload.alternate_phone = formData.alternate_phone?.trim() || null;
    if (formData.email !== undefined) payload.email = formData.email?.trim() || null;
    if (formData.address !== undefined) payload.address = formData.address?.trim() || null;
    if (formData.city !== undefined) payload.city = formData.city?.trim() || null;
    if (formData.branch !== undefined) payload.branch = formData.branch || null;
    if (formData.notes !== undefined) payload.notes = formData.notes?.trim() || null;

    const { error } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update customer.";
    return { success: false, error: msg };
  }
}
