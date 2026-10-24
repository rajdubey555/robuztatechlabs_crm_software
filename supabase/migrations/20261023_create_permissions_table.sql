-- Migration: 20261023_create_permissions_table.sql
-- Description: Create staff_permissions table for persisting employee-specific access controls

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by employee_id
CREATE INDEX IF NOT EXISTS idx_staff_permissions_employee_id ON public.staff_permissions(employee_id);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS trg_staff_permissions_updated_at ON public.staff_permissions;
CREATE TRIGGER trg_staff_permissions_updated_at
BEFORE UPDATE ON public.staff_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to Supabase roles
GRANT ALL ON TABLE public.staff_permissions TO authenticated, anon, service_role;
