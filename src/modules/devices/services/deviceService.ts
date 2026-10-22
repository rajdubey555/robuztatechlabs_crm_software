import { createClient } from "@/lib/supabase/client";
import { Device, DeviceFormData } from "@/types/device";
import { RepairJob } from "@/types/job";
import { convertToWebP } from "@/lib/image-utils";

export interface DeviceHistoryResult {
  device: Device | null;
  jobs: RepairJob[];
  error?: string | null;
}

/**
 * Fetch all registered devices with customer information
 */
export async function getDevices(): Promise<{ data: Device[]; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("devices")
      .select(`
        *,
        customer:customers (
          id,
          customer_code,
          full_name,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as unknown as Device[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load devices.";
    return { data: [], error: msg };
  }
}

/**
 * Fetch a single device with customer info and attachments
 */
export async function getDeviceById(id: string): Promise<{ data: Device | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("devices")
      .select(`
        *,
        customer:customers (
          id,
          customer_code,
          full_name,
          phone
        ),
        attachments:device_attachments (*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as unknown as Device, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load device.";
    return { data: null, error: msg };
  }
}

/**
 * Fetch device along with its repair job history
 */
export async function getDeviceWithHistory(id: string): Promise<DeviceHistoryResult> {
  const supabase = createClient();
  try {
    // 1. Fetch device details
    const { data: device, error: devErr } = await supabase
      .from("devices")
      .select(`
        *,
        customer:customers (
          id,
          customer_code,
          full_name,
          phone
        ),
        attachments:device_attachments (*)
      `)
      .eq("id", id)
      .single();

    if (devErr || !device) {
      return { device: null, jobs: [], error: devErr?.message || "Device not found." };
    }

    // 2. Fetch repair jobs for this device
    const { data: jobs } = await supabase
      .from("repair_jobs")
      .select(`
        *,
        customer:customers (
          id,
          customer_code,
          full_name,
          phone
        ),
        assigned_employee:employees!repair_jobs_assigned_employee_id_fkey (
          id,
          employee_code,
          full_name,
          role
        )
      `)
      .eq("device_id", id)
      .order("created_at", { ascending: false });

    return {
      device: device as unknown as Device,
      jobs: (jobs as unknown as RepairJob[]) || [],
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load device history.";
    return { device: null, jobs: [], error: msg };
  }
}

/**
 * Register a new device with optional attachments
 */
export async function createDevice(
  formData: DeviceFormData,
  photos?: File[]
): Promise<{ data: Device | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Insert device record
    const { data: newDevice, error: insertError } = await supabase
      .from("devices")
      .insert([
        {
          customer_id: formData.customer_id,
          device_type: formData.device_type,
          category_type: formData.category_type || (formData.device_type === "Drone" ? "drone" : "laptop_general"),
          branch: formData.branch || "south_bopal",
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          serial_number: formData.serial_number?.trim() || null,
          imei: formData.imei?.trim() || null,
          color: formData.color?.trim() || null,
          ram: formData.ram?.trim() || null,
          storage: formData.storage?.trim() || null,
          operating_system: formData.operating_system?.trim() || null,
          password_note: formData.password_note?.trim() || null,
          accessories: formData.accessories?.trim() || null,
          physical_condition: formData.physical_condition?.trim() || null,
        },
      ])
      .select()
      .single();

    if (insertError || !newDevice) {
      return { data: null, error: insertError?.message || "Failed to create device record." };
    }

    // 2. Upload photos if provided
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        try {
          const webpBlob = await convertToWebP(photo);
          const fileName = `${newDevice.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
          const filePath = `${newDevice.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("device-attachments")
            .upload(filePath, webpBlob, { contentType: "image/webp" });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("device-attachments")
              .getPublicUrl(filePath);

            await supabase.from("device_attachments").insert([
              {
                device_id: newDevice.id,
                file_url: publicUrlData.publicUrl,
                file_name: photo.name,
                file_type: "image/webp",
                uploaded_by: user?.email || null,
              },
            ]);
          }
        } catch (uploadErr) {
          console.warn("Failed to upload photo attachment:", uploadErr);
        }
      }
    }

    return { data: newDevice as Device, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { data: null, error: msg };
  }
}

/**
 * Update an existing device record
 */
export async function updateDevice(
  id: string,
  formData: Partial<DeviceFormData>
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const payload: Record<string, unknown> = {};
    if (formData.device_type !== undefined) payload.device_type = formData.device_type;
    if (formData.category_type !== undefined) payload.category_type = formData.category_type;
    if (formData.branch !== undefined) payload.branch = formData.branch;
    if (formData.brand !== undefined) payload.brand = formData.brand.trim();
    if (formData.model !== undefined) payload.model = formData.model.trim();
    if (formData.serial_number !== undefined) payload.serial_number = formData.serial_number?.trim() || null;
    if (formData.imei !== undefined) payload.imei = formData.imei?.trim() || null;
    if (formData.color !== undefined) payload.color = formData.color?.trim() || null;
    if (formData.ram !== undefined) payload.ram = formData.ram?.trim() || null;
    if (formData.storage !== undefined) payload.storage = formData.storage?.trim() || null;
    if (formData.operating_system !== undefined) payload.operating_system = formData.operating_system?.trim() || null;
    if (formData.password_note !== undefined) payload.password_note = formData.password_note?.trim() || null;
    if (formData.accessories !== undefined) payload.accessories = formData.accessories?.trim() || null;
    if (formData.physical_condition !== undefined) payload.physical_condition = formData.physical_condition?.trim() || null;

    const { error } = await supabase
      .from("devices")
      .update(payload)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update device.";
    return { success: false, error: msg };
  }
}
