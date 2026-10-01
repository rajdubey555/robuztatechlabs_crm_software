-- Create Device Code Sequence
CREATE SEQUENCE IF NOT EXISTS device_code_seq START WITH 1;

-- Create Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  imei TEXT,
  color TEXT,
  ram TEXT,
  storage TEXT,
  operating_system TEXT,
  password_note TEXT,
  accessories TEXT,
  physical_condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Device Attachments Table (for intake photos)
CREATE TABLE IF NOT EXISTS public.device_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant table & sequence permissions to Supabase roles
GRANT ALL ON TABLE public.devices TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.device_attachments TO authenticated, anon, service_role;
GRANT ALL ON SEQUENCE device_code_seq TO authenticated, anon, service_role;

-- Trigger Function to generate safe unique Device Code (DEV-YYYY-XXXX)
CREATE OR REPLACE FUNCTION generate_device_code()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_num INT;
BEGIN
  IF NEW.device_code IS NULL OR NEW.device_code = '' THEN
    SELECT NEXTVAL('device_code_seq') INTO seq_num;
    NEW.device_code := 'DEV-' || current_year || '-' || LPAD(seq_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for Device Code generation
DROP TRIGGER IF EXISTS trg_generate_device_code ON public.devices;
CREATE TRIGGER trg_generate_device_code
BEFORE INSERT ON public.devices
FOR EACH ROW
EXECUTE FUNCTION generate_device_code();

-- Attach trigger for updated_at
DROP TRIGGER IF EXISTS trg_devices_updated_at ON public.devices;
CREATE TRIGGER trg_devices_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on devices
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated users can insert devices" ON public.devices;
DROP POLICY IF EXISTS "Authenticated users can update devices" ON public.devices;

CREATE POLICY "Authenticated users can select devices"
ON public.devices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert devices"
ON public.devices FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update devices"
ON public.devices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Enable Row Level Security (RLS) on device_attachments
ALTER TABLE public.device_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select device_attachments" ON public.device_attachments;
DROP POLICY IF EXISTS "Authenticated users can insert device_attachments" ON public.device_attachments;
DROP POLICY IF EXISTS "Authenticated users can delete device_attachments" ON public.device_attachments;

CREATE POLICY "Authenticated users can select device_attachments"
ON public.device_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert device_attachments"
ON public.device_attachments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete device_attachments"
ON public.device_attachments FOR DELETE TO authenticated USING (true);

-- =========================================================
-- Supabase Storage Bucket Initialization Instructions:
-- Create a new bucket in Supabase Dashboard -> Storage:
-- Bucket Name: device-attachments
-- Public: false
-- Add Storage Policies for 'authenticated' users (SELECT, INSERT, DELETE)
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-attachments', 'device-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Authenticated users can read device-attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'device-attachments');

CREATE POLICY "Authenticated users can upload device-attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'device-attachments');

CREATE POLICY "Authenticated users can delete device-attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'device-attachments');
