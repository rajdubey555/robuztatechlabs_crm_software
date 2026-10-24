export type ExpenseCategory =
  | "parts"
  | "rent"
  | "utilities"
  | "salaries"
  | "tools_consumables"
  | "logistics"
  | "petty_cash"
  | "marketing"
  | "other";

export type PaymentMethod =
  | "upi"
  | "cash"
  | "bank_transfer"
  | "card"
  | "cheque";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  branch: "south_bopal" | "tragad" | "both";
  payment_method: PaymentMethod;
  paid_to?: string | null;
  paid_by?: string | null;
  vendor_id?: string | null;
  part_request_id?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  expense_date: string;
  created_at?: string;
  updated_at?: string;
  vendor?: { id: string; name: string } | null;
}

export interface ExpenseCategoryMeta {
  key: ExpenseCategory;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  parts: {
    key: "parts",
    label: "Spare Parts",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200/80 dark:border-amber-800/80",
  },
  rent: {
    key: "rent",
    label: "Shop Rent",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-200/80 dark:border-purple-800/80",
  },
  utilities: {
    key: "utilities",
    label: "Electricity & Wi-Fi",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200/80 dark:border-blue-800/80",
  },
  salaries: {
    key: "salaries",
    label: "Staff Salaries",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200/80 dark:border-rose-900/80",
  },
  tools_consumables: {
    key: "tools_consumables",
    label: "Tools & Flux",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/40",
    borderColor: "border-teal-200/80 dark:border-teal-800/80",
  },
  logistics: {
    key: "logistics",
    label: "Courier & Travel",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200/80 dark:border-indigo-800/80",
  },
  petty_cash: {
    key: "petty_cash",
    label: "Tea & Daily Cash",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200/80 dark:border-emerald-800/80",
  },
  marketing: {
    key: "marketing",
    label: "Ads & Promotion",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/40",
    borderColor: "border-pink-200/80 dark:border-pink-800/80",
  },
  other: {
    key: "other",
    label: "General / Other",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-800",
    borderColor: "border-slate-200 dark:border-slate-700",
  },
};
