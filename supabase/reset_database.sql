-- ==============================================================================
-- ROBUZTA CRM - TOTAL DATABASE RESET SCRIPT
-- ==============================================================================
-- Run this in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/vnkiqdgdiihgtqpmytzb
-- 2. Click "SQL Editor" on the left menu
-- 3. Paste this script and click "Run"
-- ==============================================================================

-- STEP 1: Delete all CRM business data (Foreign keys cascade cleanly)
TRUNCATE TABLE 
  device_attachments,
  part_requests,
  diagnoses,
  job_assignments,
  repair_jobs,
  devices,
  device_catalog,
  customers,
  vendors,
  employees
CASCADE;

-- STEP 2: Delete all login accounts / auth users
DELETE FROM auth.users;

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================
SELECT 'All CRM records, devices, tickets, customers and users deleted successfully!' AS status;
