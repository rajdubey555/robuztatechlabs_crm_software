export interface Vendor {
  id: string;
  vendor_code?: string;
  name: string;
  contact_person?: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  city?: string;
  category?: string;
  rating?: number;
  is_active?: boolean;
  is_preferred?: boolean;
  created_at?: string;
  updated_at?: string;
}
