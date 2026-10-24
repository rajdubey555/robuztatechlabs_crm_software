-- Migration: 20261024_add_delete_policy_repair_jobs.sql
-- Description: Enable DELETE permissions and RLS policies for repair_jobs and all related child tables

-- 1. Grant DELETE permissions to Supabase roles
GRANT DELETE ON TABLE public.repair_jobs TO authenticated, anon, service_role;
GRANT DELETE ON TABLE public.diagnoses TO authenticated, anon, service_role;
GRANT DELETE ON TABLE public.job_assignments TO authenticated, anon, service_role;
GRANT DELETE ON TABLE public.part_requests TO authenticated, anon, service_role;

-- 2. Add RLS DELETE policy for repair_jobs
DROP POLICY IF EXISTS "Authenticated users can delete repair_jobs" ON public.repair_jobs;
DROP POLICY IF EXISTS "Allow delete on repair_jobs" ON public.repair_jobs;
CREATE POLICY "Allow delete on repair_jobs"
ON public.repair_jobs FOR DELETE
TO authenticated, anon, service_role
USING (true);

-- 3. Add RLS DELETE policy for diagnoses
DROP POLICY IF EXISTS "Authenticated users can delete diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Allow delete on diagnoses" ON public.diagnoses;
CREATE POLICY "Allow delete on diagnoses"
ON public.diagnoses FOR DELETE
TO authenticated, anon, service_role
USING (true);

-- 4. Add RLS DELETE policy for job_assignments
DROP POLICY IF EXISTS "Authenticated users can delete job_assignments" ON public.job_assignments;
DROP POLICY IF EXISTS "Allow delete on job_assignments" ON public.job_assignments;
CREATE POLICY "Allow delete on job_assignments"
ON public.job_assignments FOR DELETE
TO authenticated, anon, service_role
USING (true);

-- 5. Add RLS DELETE policy for part_requests
DROP POLICY IF EXISTS "Authenticated users can delete part_requests" ON public.part_requests;
DROP POLICY IF EXISTS "Allow delete on part_requests" ON public.part_requests;
CREATE POLICY "Allow delete on part_requests"
ON public.part_requests FOR DELETE
TO authenticated, anon, service_role
USING (true);
