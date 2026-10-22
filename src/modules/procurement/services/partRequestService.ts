import { createClient } from "@/lib/supabase/client";
import { PartRequest, PartRequestStatus, CreatePartRequestInput } from "@/types/partRequest";

/**
 * Fetch all part requests ordered by created_at DESC
 */
export async function getPartRequests(): Promise<{ data: PartRequest[]; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("part_requests")
      .select(`
        *,
        vendor:vendors(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as PartRequest[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load part requests.";
    return { data: [], error: msg };
  }
}

/**
 * Resilient status updater with automatic legacy DB constraint fallback
 */
export async function updatePartRequestStatus(
  ids: string | string[],
  newStatus: PartRequestStatus
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const idList = Array.isArray(ids) ? ids : [ids];
  if (idList.length === 0) return { success: true, error: null };

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "ORDERED") {
    updateData.ordered_at = new Date().toISOString();
  } else if (newStatus === "RECEIVED") {
    updateData.received_at = new Date().toISOString();
  }

  try {
    // Try primary uppercase status (e.g. "CANCELLED", "ORDERED", "RECEIVED")
    let { error } = await supabase
      .from("part_requests")
      .update(updateData)
      .in("id", idList);

    // If legacy constraint error occurs, retry with lowercase status
    if (error && (error.message?.includes("part_requests_status_check") || error.code === "23514")) {
      const fallbackMap: Record<string, string> = {
        CANCELLED: "cancelled",
        ORDERED: "ordered",
        RECEIVED: "received",
        PENDING: "requested",
      };

      const fallbackVal = fallbackMap[newStatus] || newStatus.toLowerCase();
      const fallbackUpdateData = { ...updateData, status: fallbackVal };

      const retryRes = await supabase
        .from("part_requests")
        .update(fallbackUpdateData)
        .in("id", idList);

      error = retryRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update part request status.";
    return { success: false, error: msg };
  }
}

/**
 * Delete a part request by ID
 */
export async function deletePartRequest(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("part_requests")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete part request.";
    return { success: false, error: msg };
  }
}

/**
 * Upload part image to Supabase Storage
 */
export async function uploadPartRequestImage(file: File): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `part_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `requests/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from("part-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadErr) {
      return { url: null, error: uploadErr.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("part-images")
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload part image.";
    return { url: null, error: msg };
  }
}
