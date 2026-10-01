-- Create Diagnoses Table
CREATE TABLE IF NOT EXISTS public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_job_id UUID NOT NULL REFERENCES public.repair_jobs(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  recommended_action TEXT,
  estimated_cost NUMERIC(10,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update repair_jobs status check constraint to include 'diagnosed'
ALTER TABLE public.repair_jobs DROP CONSTRAINT IF EXISTS repair_jobs_status_check;
ALTER TABLE public.repair_jobs ADD CONSTRAINT repair_jobs_status_check 
  CHECK (status IN ('received', 'diagnosis_pending', 'diagnosed', 'cancelled', 'unrepairable'));

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_diagnoses_repair_job_id ON public.diagnoses(repair_job_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_employee_id ON public.diagnoses(employee_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON public.diagnoses(created_at);

-- Grant permissions to Supabase roles
GRANT ALL ON TABLE public.diagnoses TO authenticated, anon, service_role;

-- Attach trigger for updated_at
DROP TRIGGER IF EXISTS trg_diagnoses_updated_at ON public.diagnoses;
CREATE TRIGGER trg_diagnoses_updated_at
BEFORE UPDATE ON public.diagnoses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on diagnoses
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Authenticated users can insert diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Authenticated users can update diagnoses" ON public.diagnoses;

CREATE POLICY "Authenticated users can select diagnoses"
ON public.diagnoses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert diagnoses"
ON public.diagnoses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update diagnoses"
ON public.diagnoses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
