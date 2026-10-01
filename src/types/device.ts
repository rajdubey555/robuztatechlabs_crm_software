export type DeviceType =
  | "Laptop"
  | "Desktop"
  | "MacBook"
  | "iPhone"
  | "Android Phone"
  | "Tablet"
  | "Other";

export interface DeviceAttachment {
  id: string;
  device_id: string;
  file_url: string;
  file_name: string;
  file_type?: string | null;
  uploaded_by?: string | null;
  created_at: string;
}

export interface Device {
  id: string;
  device_code: string;
  customer_id: string;
  device_type: DeviceType;
  brand: string;
  model: string;
  serial_number?: string | null;
  imei?: string | null;
  color?: string | null;
  ram?: string | null;
  storage?: string | null;
  operating_system?: string | null;
  password_note?: string | null;
  accessories?: string | null;
  physical_condition?: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    customer_code: string;
    full_name: string;
    phone: string;
  };
  attachments?: DeviceAttachment[];
}

export interface DeviceFormData {
  customer_id: string;
  device_type: DeviceType;
  brand: string;
  model: string;
  serial_number?: string;
  imei?: string;
  color?: string;
  ram?: string;
  storage?: string;
  operating_system?: string;
  password_note?: string;
  accessories?: string;
  physical_condition?: string;
}

export interface DeviceFormErrors {
  customer_id?: string;
  device_type?: string;
  brand?: string;
  model?: string;
  imei?: string;
}
