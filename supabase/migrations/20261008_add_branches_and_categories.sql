-- Migration: Add Branch and Category Support to Robuzta CRM

-- 1. Add Branch and Category columns to repair_jobs
ALTER TABLE public.repair_jobs
ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT 'south_bopal' CHECK (branch IN ('south_bopal', 'tragad')),
ADD COLUMN IF NOT EXISTS category_type TEXT NOT NULL DEFAULT 'laptop_general' CHECK (category_type IN ('laptop_general', 'drone'));

-- 2. Add Branch and Specialization/Category columns to employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT 'south_bopal' CHECK (branch IN ('south_bopal', 'tragad', 'both')),
ADD COLUMN IF NOT EXISTS category_type TEXT NOT NULL DEFAULT 'laptop_general' CHECK (category_type IN ('laptop_general', 'drone', 'both'));

-- 3. Add Branch and Category to customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'south_bopal' CHECK (branch IN ('south_bopal', 'tragad', 'both'));

-- 4. Add Category and Branch to devices
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'south_bopal' CHECK (branch IN ('south_bopal', 'tragad')),
ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'laptop_general' CHECK (category_type IN ('laptop_general', 'drone'));

-- 5. Add Category and Branch to part_requests
ALTER TABLE public.part_requests
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'south_bopal' CHECK (branch IN ('south_bopal', 'tragad')),
ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'laptop_general' CHECK (category_type IN ('laptop_general', 'drone'));

-- 6. Add Branch to vendors
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'both' CHECK (branch IN ('south_bopal', 'tragad', 'both'));

-- 7. Add Category to device_catalog
ALTER TABLE public.device_catalog
ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'laptop_general' CHECK (category_type IN ('laptop_general', 'drone'));

-- Create Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_repair_jobs_branch ON public.repair_jobs(branch);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_category ON public.repair_jobs(category_type);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON public.customers(branch);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON public.employees(branch);
CREATE INDEX IF NOT EXISTS idx_devices_category ON public.devices(category_type);
CREATE INDEX IF NOT EXISTS idx_part_requests_branch ON public.part_requests(branch);
