-- Migration: Reset / Clear All Existing Test Data in Robuzta CRM

-- 1. Truncate all transactional tables in proper dependency order
TRUNCATE TABLE public.part_requests RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.job_assignments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.diagnoses RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.repair_jobs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.device_attachments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.devices RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.customers RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.employees RESTART IDENTITY CASCADE;

-- 2. Reset Sequence Generators back to 1 for clean ID numbering (CUS-2026-0001, DEV-2026-0001, JOB-2026-0001)
ALTER SEQUENCE IF EXISTS customer_code_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS device_code_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS job_code_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_code_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS part_request_seq RESTART WITH 1;
