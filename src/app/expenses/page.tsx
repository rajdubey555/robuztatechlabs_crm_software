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

  // Fetch expenses, vendors, and revenue in parallel
  const [expensesRes, vendorsRes, jobsRes] = await Promise.all([
    supabase
      .from("expenses")
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .order("expense_date", { ascending: false }),
    supabase
      .from("vendors")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("repair_jobs")
      .select("final_cost, status")
  ]);

  const expensesData: Expense[] = (!expensesRes.error && expensesRes.data) ? (expensesRes.data as Expense[]) : [];
  const vendorsData: { id: string; name: string }[] = vendorsRes.data || [];
  
  let serviceRevenue = 0;
  if (jobsRes.data) {
    serviceRevenue = jobsRes.data.reduce((sum, j) => {
      const cost = Number(j.final_cost || 0);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);
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
