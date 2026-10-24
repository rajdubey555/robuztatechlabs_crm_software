-- Migration: 20261023_expand_job_statuses.sql
-- Description: Expand repair_jobs status check constraint to support the complete repair lifecycle:
-- received -> diagnosis_pending -> diagnosed -> waiting_parts -> in_progress -> ready_for_delivery -> delivered
-- Plus terminal states: cancelled, unrepairable

ALTER TABLE public.repair_jobs DROP CONSTRAINT IF EXISTS repair_jobs_status_check;

ALTER TABLE public.repair_jobs ADD CONSTRAINT repair_jobs_status_check 
  CHECK (status IN (
    'received',
    'diagnosis_pending',
    'diagnosed',
    'waiting_parts',
    'in_progress',
    'ready_for_delivery',
    'delivered',
    'cancelled',
    'unrepairable'
  ));
