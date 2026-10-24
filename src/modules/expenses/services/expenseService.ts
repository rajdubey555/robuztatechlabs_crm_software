import { createClient } from "@/lib/supabase/client";
import { Expense, ExpenseCategory } from "@/types/expense";

export interface ExpenseFilterParams {
  branch?: string;
  category?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

export interface FinancialStats {
  totalExpense: number;
  totalRevenue: number;
  netProfit: number;
  bopalExpense: number;
  tragadExpense: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  expenseCount: number;
}

export async function getExpenses(): Promise<{ data: Expense[]; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .order("expense_date", { ascending: false });

    if (error) throw error;
    return { data: (data as Expense[]) || [], error: null };
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to load expenses.";
    return { data: [], error: msg };
  }
}

export async function createExpense(
  payload: Omit<Expense, "id" | "created_at" | "updated_at" | "vendor">
): Promise<{ data: Expense | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("expenses")
      .insert([payload])
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .single();

    if (error) throw error;
    return { data: data as Expense, error: null };
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to create expense.";
    return { data: null, error: msg };
  }
}

export async function updateExpense(
  id: string,
  payload: Partial<Omit<Expense, "id" | "created_at" | "updated_at" | "vendor">>
): Promise<{ data: Expense | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("expenses")
      .update(payload)
      .eq("id", id)
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .single();

    if (error) throw error;
    return { data: data as Expense, error: null };
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to update expense.";
    return { data: null, error: msg };
  }
}

export async function deleteExpense(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Failed to delete expense.";
    return { success: false, error: msg };
  }
}
