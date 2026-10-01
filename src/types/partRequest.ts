import { Vendor } from "./vendor";

export type PartRequestStatus = "PENDING" | "ORDERED" | "RECEIVED" | "CANCELLED";
export type PartRequestPriority = "NORMAL" | "URGENT";

export interface PartRequest {
  id: string;
  request_code: string;
  repair_job_id?: string;
  requested_by?: string;
  requested_by_name?: string;
  vendor_id?: string;
  vendor?: Vendor;
  part_name: string;
  quantity: number;
  image_url?: string;
  priority: PartRequestPriority;
  status: PartRequestStatus;
  notes?: string;
  estimated_cost?: number;
  job_card_number?: string;
  customer_name?: string;
  device_model?: string;
  ordered_at?: string;
  received_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePartRequestInput {
  repair_job_id?: string;
  vendor_id?: string;
  part_name: string;
  quantity: number;
  image_url?: string;
  priority: PartRequestPriority;
  notes?: string;
  job_card_number?: string;
  customer_name?: string;
  device_model?: string;
}
