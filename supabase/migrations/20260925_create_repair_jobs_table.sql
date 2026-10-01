-- Create Job Code Sequence
CREATE SEQUENCE IF NOT EXISTS job_code_seq START WITH 1;

-- Create Repair Jobs Table
CREATE TABLE IF NOT EXISTS public.repair_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_code TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  customer_complaint TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'diagnosis_pending', 'cancelled', 'unrepairable')),
  estimated_cost NUMERIC(10,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  final_cost NUMERIC(10,2) CHECK (final_cost IS NULL OR final_cost >= 0),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_delivery_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries and joins
CREATE INDEX IF NOT EXISTS idx_repair_jobs_customer_id ON public.repair_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_device_id ON public.repair_jobs(device_id);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_job_code ON public.repair_jobs(job_code);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_status ON public.repair_jobs(status);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_priority ON public.repair_jobs(priority);

-- Grant permissions to Supabase roles
GRANT ALL ON TABLE public.repair_jobs TO authenticated, anon, service_role;
GRANT ALL ON SEQUENCE job_code_seq TO authenticated, anon, service_role;

-- Trigger Function to generate safe unique Job Code (JOB-YYYY-XXXX)
CREATE OR REPLACE FUNCTION generate_job_code()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_num INT;
BEGIN
  IF NEW.job_code IS NULL OR NEW.job_code = '' THEN
    SELECT NEXTVAL('job_code_seq') INTO seq_num;
    NEW.job_code := 'JOB-' || current_year || '-' || LPAD(seq_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for Job Code generation
DROP TRIGGER IF EXISTS trg_generate_job_code ON public.repair_jobs;
CREATE TRIGGER trg_generate_job_code
BEFORE INSERT ON public.repair_jobs
FOR EACH ROW
EXECUTE FUNCTION generate_job_code();

-- Attach trigger for updated_at
DROP TRIGGER IF EXISTS trg_repair_jobs_updated_at ON public.repair_jobs;
CREATE TRIGGER trg_repair_jobs_updated_at
BEFORE UPDATE ON public.repair_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.repair_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select repair_jobs" ON public.repair_jobs;
DROP POLICY IF EXISTS "Authenticated users can insert repair_jobs" ON public.repair_jobs;
DROP POLICY IF EXISTS "Authenticated users can update repair_jobs" ON public.repair_jobs;

CREATE POLICY "Authenticated users can select repair_jobs"
ON public.repair_jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert repair_jobs"
ON public.repair_jobs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update repair_jobs"
ON public.repair_jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
