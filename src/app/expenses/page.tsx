import { createClient } from "@/lib/supabase/server";
import { ExpensesPageClient } from "@/components/expenses/ExpensesPageClient";
import { Expense } from "@/types/expense";

export const metadata = {
  title: "Expenses & Financial Health | Robuzta CRM",
  description: "Company expenditure, shop utilities, parts procurement, and net profit tracker for Robuzta CRM",
};

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch expenses
  let expensesData: Expense[] = [];
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .order("expense_date", { ascending: false });

    if (!error && data) {
      expensesData = data as Expense[];
    }
  } catch {
    expensesData = [];
  }

  // 2. Fetch verified vendors for expense dropdown
  let vendorsData: { id: string; name: string }[] = [];
  try {
    const { data } = await supabase
      .from("vendors")
      .select("id, name")
      .order("name", { ascending: true });

    if (data) vendorsData = data;
  } catch {
    vendorsData = [];
  }

  // 3. Calculate Service Revenue from completed/delivered repair jobs for real-time P&L
  let serviceRevenue = 0;
  try {
    const { data: jobs } = await supabase
      .from("repair_jobs")
      .select("final_cost, status");

    if (jobs) {
      serviceRevenue = jobs.reduce((sum, j) => {
        const cost = Number(j.final_cost || 0);
        return sum + (isNaN(cost) ? 0 : cost);
      }, 0);
    }
  } catch {
    serviceRevenue = 0;
  }

  return (
    <ExpensesPageClient
      initialExpenses={expensesData}
      vendors={vendorsData}
      userEmail={user?.email || undefined}
      serviceRevenue={serviceRevenue}
    />
  );
}
