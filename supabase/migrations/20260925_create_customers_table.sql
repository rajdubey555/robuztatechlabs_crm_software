-- Create Customer Code Sequence
CREATE SEQUENCE IF NOT EXISTS customer_code_seq START WITH 1;

-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant table & sequence permissions to Supabase roles
GRANT ALL ON TABLE public.customers TO authenticated, anon, service_role;
GRANT ALL ON SEQUENCE customer_code_seq TO authenticated, anon, service_role;

-- Trigger Function to generate safe unique Customer Code (CUS-YYYY-XXXX)
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_num INT;
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    SELECT NEXTVAL('customer_code_seq') INTO seq_num;
    NEW.customer_code := 'CUS-' || current_year || '-' || LPAD(seq_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for Customer Code generation
DROP TRIGGER IF EXISTS trg_generate_customer_code ON public.customers;
CREATE TRIGGER trg_generate_customer_code
BEFORE INSERT ON public.customers
FOR EACH ROW
EXECUTE FUNCTION generate_customer_code();

-- Trigger Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for updated_at
DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent duplicate policy errors on re-run
DROP POLICY IF EXISTS "Authenticated users can select customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;

-- RLS Policies for Authenticated CRM users
CREATE POLICY "Authenticated users can select customers"
ON public.customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
