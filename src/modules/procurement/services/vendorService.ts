import { createClient } from "@/lib/supabase/client";
import { Vendor } from "@/types/vendor";

/**
 * Fetch all vendors ordered by name ASC
 */
export async function getVendors(): Promise<{ data: Vendor[]; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as Vendor[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load vendors.";
    return { data: [], error: msg };
  }
}

/**
 * Fetch a single vendor by ID
 */
export async function getVendorById(id: string): Promise<{ data: Vendor | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Vendor, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load vendor.";
    return { data: null, error: msg };
  }
}

/**
 * Create a new vendor
 */
export async function createVendor(
  vendorData: Omit<Vendor, "id" | "created_at" | "updated_at">
): Promise<{ data: Vendor | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("vendors")
      .insert(vendorData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Vendor, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create vendor.";
    return { data: null, error: msg };
  }
}

/**
 * Update an existing vendor
 */
export async function updateVendor(
  id: string,
  updates: Partial<Vendor>
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("vendors")
      .update(updates)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update vendor.";
    return { success: false, error: msg };
  }
}

/**
 * Delete a vendor
 */
export async function deleteVendor(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete vendor.";
    return { success: false, error: msg };
  }
}

/**
 * Toggle preferred vendor flag
 */
export async function togglePreferredVendor(
  id: string,
  currentStatus?: boolean
): Promise<{ success: boolean; error: string | null }> {
  return updateVendor(id, { is_preferred: !currentStatus });
}
