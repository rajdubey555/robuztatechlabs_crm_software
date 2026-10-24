-- Migration: 20261024_create_expenses_table.sql
-- Description: Create expenses table for tracking company-wide expenditures, spare parts procurement, utilities, salaries, and shop petty cash

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL DEFAULT 'other',
  branch TEXT NOT NULL DEFAULT 'both',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  paid_to TEXT,
  paid_by TEXT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  part_request_id UUID REFERENCES public.part_requests(id) ON DELETE SET NULL,
  receipt_url TEXT,
  notes TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for fast filtering by date, branch, category, and vendor
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON public.expenses(branch);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor_id ON public.expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_part_request_id ON public.expenses(part_request_id);

-- Attach updated_at trigger if function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.expenses;
    CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Grant permissions to Supabase roles
GRANT ALL ON TABLE public.expenses TO authenticated, anon, service_role;

-- Enable Row Level Security and add policies
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow insert on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow update on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow delete on expenses" ON public.expenses;

CREATE POLICY "Allow select on expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow insert on expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on expenses" ON public.expenses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on expenses" ON public.expenses FOR DELETE USING (true);

-- Optional Starter Expenses for Demo / Initial Setup
INSERT INTO public.expenses (title, amount, category, branch, payment_method, paid_to, notes, expense_date)
VALUES
  ('South Bopal Workshop Rent', 28000, 'rent', 'south_bopal', 'bank_transfer', 'Patel Commercial Complex', 'Monthly premises rent for South Bopal center', CURRENT_DATE - INTERVAL '15 days'),
  ('Tragad Workshop Rent', 22000, 'rent', 'tragad', 'bank_transfer', 'Tragad Arcade Management', 'Monthly premises rent for Tragad center', CURRENT_DATE - INTERVAL '14 days'),
  ('Torrent Power Electricity Bill (Bopal Lab)', 4250, 'utilities', 'south_bopal', 'upi', 'Torrent Power Ltd', 'Lab power & test bench equipment electricity', CURRENT_DATE - INTERVAL '7 days'),
  ('Airtel Xstream Fiber 300Mbps Internet', 1199, 'utilities', 'both', 'upi', 'Airtel Broadband', 'Diagnostic server & companion upload network', CURRENT_DATE - INTERVAL '5 days'),
  ('Thermal Grizzly Kryonaut Paste & Solder Flux', 3450, 'tools_consumables', 'south_bopal', 'card', 'Robuzta Lab Tools', 'High-end thermal compound & leaded flux for BGA rework', CURRENT_DATE - INTERVAL '3 days'),
  ('Inter-Branch Parts Courier (Tragad <-> Bopal)', 380, 'logistics', 'both', 'cash', 'Shree Maruti Courier', 'Laptop motherboard & drone motor dispatch', CURRENT_DATE - INTERVAL '2 days'),
  ('Workshop Tea & Staff Refreshments (Weekly)', 650, 'petty_cash', 'south_bopal', 'cash', 'Local Tea Stall', 'Daily lab technicians tea and snacks petty cash', CURRENT_DATE)
ON CONFLICT DO NOTHING;

