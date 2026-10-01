-- Create Employee Code Sequence
CREATE SEQUENCE IF NOT EXISTS employee_code_seq START WITH 1;

-- Create Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'reception', 'technician', 'purchase', 'accountant')),
  specialization TEXT CHECK (specialization IS NULL OR specialization IN ('laptop', 'mobile', 'apple', 'hardware', 'software', 'general')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add assigned_employee_id to repair_jobs if not already present
ALTER TABLE public.repair_jobs
ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- Create Job Assignments Table (Historical History)
CREATE TABLE IF NOT EXISTS public.job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_job_id UUID NOT NULL REFERENCES public.repair_jobs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_employees_code ON public.employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON public.job_assignments(repair_job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_employee_id ON public.job_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_assigned_emp ON public.repair_jobs(assigned_employee_id);

-- Grant permissions to Supabase roles
GRANT ALL ON TABLE public.employees TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.job_assignments TO authenticated, anon, service_role;
GRANT ALL ON SEQUENCE employee_code_seq TO authenticated, anon, service_role;

-- Trigger Function for safe Employee Code (EMP-YYYY-XXXX)
CREATE OR REPLACE FUNCTION generate_employee_code()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_num INT;
BEGIN
  IF NEW.employee_code IS NULL OR NEW.employee_code = '' THEN
    SELECT NEXTVAL('employee_code_seq') INTO seq_num;
    NEW.employee_code := 'EMP-' || current_year || '-' || LPAD(seq_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for Employee Code generation
DROP TRIGGER IF EXISTS trg_generate_employee_code ON public.employees;
CREATE TRIGGER trg_generate_employee_code
BEFORE INSERT ON public.employees
FOR EACH ROW
EXECUTE FUNCTION generate_employee_code();

-- Attach trigger for updated_at
DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON public.employees;

CREATE POLICY "Authenticated users can select employees"
ON public.employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert employees"
ON public.employees FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
ON public.employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Enable Row Level Security (RLS) on job_assignments
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select job_assignments" ON public.job_assignments;
DROP POLICY IF EXISTS "Authenticated users can insert job_assignments" ON public.job_assignments;
DROP POLICY IF EXISTS "Authenticated users can update job_assignments" ON public.job_assignments;

CREATE POLICY "Authenticated users can select job_assignments"
ON public.job_assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert job_assignments"
ON public.job_assignments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update job_assignments"
ON public.job_assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
