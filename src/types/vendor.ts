export interface Vendor {
  id: string;
  vendor_code?: string | null;
  name: string;
  contact_person?: string | null;
  phone?: string;
  whatsapp_number?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  category?: string | null;
  rating?: number | null;
  is_active?: boolean;
  is_preferred?: boolean;
  created_at?: string;
  updated_at?: string;
}
