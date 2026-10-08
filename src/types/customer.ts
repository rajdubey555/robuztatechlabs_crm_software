export interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  alternate_phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  branch?: "south_bopal" | "tragad" | "both" | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  full_name: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  branch?: "south_bopal" | "tragad" | "both";
  notes?: string;
}

export interface CustomerFormErrors {
  full_name?: string;
  phone?: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}
