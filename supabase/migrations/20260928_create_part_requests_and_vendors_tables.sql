-- Create Sequence for Vendor Code
CREATE SEQUENCE IF NOT EXISTS vendor_code_seq START WITH 1001;

-- Create Vendors Table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT,
  address TEXT,
  category TEXT DEFAULT 'General Parts',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS is_preferred BOOLEAN DEFAULT false;

-- Trigger Function for Vendor Code (VND-XXXX)
CREATE OR REPLACE FUNCTION generate_vendor_code()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INT;
BEGIN
  IF NEW.vendor_code IS NULL OR NEW.vendor_code = '' THEN
    SELECT NEXTVAL('vendor_code_seq') INTO seq_num;
    NEW.vendor_code := 'VND-' || seq_num::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_vendor_code ON public.vendors;
CREATE TRIGGER trg_generate_vendor_code
BEFORE INSERT ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION generate_vendor_code();

-- Create Sequence for Part Request Code
CREATE SEQUENCE IF NOT EXISTS part_request_code_seq START WITH 1001;

-- Create Part Requests Table
CREATE TABLE IF NOT EXISTS public.part_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  repair_job_id UUID REFERENCES public.repair_jobs(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  requested_by_name TEXT,
  job_card_number TEXT,
  customer_name TEXT,
  device_model TEXT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  part_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  image_url TEXT,
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT', 'normal', 'urgent')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED', 'requested', 'available', 'not_available', 'ready', 'received', 'cancelled')),
  ordered_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure nullable repair_job_id & new fields if table was already created
ALTER TABLE public.part_requests ALTER COLUMN repair_job_id DROP NOT NULL;
ALTER TABLE public.part_requests ADD COLUMN IF NOT EXISTS requested_by_name TEXT;
ALTER TABLE public.part_requests ADD COLUMN IF NOT EXISTS job_card_number TEXT;
ALTER TABLE public.part_requests ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.part_requests ADD COLUMN IF NOT EXISTS device_model TEXT;
ALTER TABLE public.part_requests ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMPTZ;

-- Trigger Function for Part Request Code (PR-2026-XXXX)
CREATE OR REPLACE FUNCTION generate_part_request_code()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_num INT;
BEGIN
  IF NEW.request_code IS NULL OR NEW.request_code = '' THEN
    SELECT NEXTVAL('part_request_code_seq') INTO seq_num;
    NEW.request_code := 'PR-' || current_year || '-' || seq_num::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_part_request_code ON public.part_requests;
CREATE TRIGGER trg_generate_part_request_code
BEFORE INSERT ON public.part_requests
FOR EACH ROW
EXECUTE FUNCTION generate_part_request_code();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_part_requests_repair_job_id ON public.part_requests(repair_job_id);
CREATE INDEX IF NOT EXISTS idx_part_requests_vendor_id ON public.part_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_part_requests_requested_by ON public.part_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_part_requests_status ON public.part_requests(status);
CREATE INDEX IF NOT EXISTS idx_part_requests_priority ON public.part_requests(priority);

-- Grants
GRANT ALL ON TABLE public.vendors TO authenticated, anon, service_role;
GRANT ALL ON SEQUENCE vendor_code_seq TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.part_requests TO authenticated, anon, service_role;
GRANT ALL ON SEQUENCE part_request_code_seq TO authenticated, anon, service_role;

-- RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select on vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow insert on vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow update on vendors" ON public.vendors;

CREATE POLICY "Allow select on vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Allow insert on vendors" ON public.vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on vendors" ON public.vendors FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select on part_requests" ON public.part_requests;
DROP POLICY IF EXISTS "Allow insert on part_requests" ON public.part_requests;
DROP POLICY IF EXISTS "Allow update on part_requests" ON public.part_requests;

CREATE POLICY "Allow select on part_requests" ON public.part_requests FOR SELECT USING (true);
CREATE POLICY "Allow insert on part_requests" ON public.part_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on part_requests" ON public.part_requests FOR UPDATE USING (true) WITH CHECK (true);

-- Insert Default Seed Vendors (if table empty)
INSERT INTO public.vendors (name, contact_person, phone, whatsapp_number, email, category, is_preferred)
SELECT 'TechParts Supplies', 'Ramesh Kumar', '+919876543210', '+919876543210', 'ramesh@techparts.in', 'Laptop & Mobile Screens', true
WHERE NOT EXISTS (SELECT 1 FROM public.vendors LIMIT 1);

INSERT INTO public.vendors (name, contact_person, phone, whatsapp_number, email, category, is_preferred)
SELECT 'Robuzta Spare Hub', 'Amit Sharma', '+919988776655', '+919988776655', 'spares@robuzta.com', 'Motherboards & ICs', true
WHERE NOT EXISTS (SELECT 1 FROM public.vendors WHERE name = 'Robuzta Spare Hub');

INSERT INTO public.vendors (name, contact_person, phone, whatsapp_number, email, category, is_preferred)
SELECT 'Apex Apple Parts', 'Vikas Verma', '+919123456789', '+919123456789', 'vikas@apexparts.com', 'MacBook & iPhone Spares', false
WHERE NOT EXISTS (SELECT 1 FROM public.vendors WHERE name = 'Apex Apple Parts');

-- Drop old status check constraint & recreate with all status variants
ALTER TABLE public.part_requests DROP CONSTRAINT IF EXISTS part_requests_status_check;
ALTER TABLE public.part_requests ADD CONSTRAINT part_requests_status_check 
  CHECK (status IN ('PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED', 'requested', 'available', 'not_available', 'ready', 'received', 'cancelled', 'pending', 'ordered'));

