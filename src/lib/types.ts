export interface Category {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  notes: string | null;
  budget_limit: number | null;
  is_income: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  month: string; // 'YYYY-MM-01'
  name: string;
  transaction_date: string;
  amount: number;
  is_recurring: boolean;
  recurring_template_id: string | null;
  created_at: string;
}

export interface RecurringTemplate {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  amount: number;
  day_of_month: number | null;
  is_active: boolean;
  created_at: string;
}

// CSV parsing types
export interface ParsedTransaction {
  name: string;
  date: string;
  amount: number;
}

export interface ParsedCategory {
  name: string;
  transactions: ParsedTransaction[];
  total: number;
  notes?: string;
}

export interface ParsedMonth {
  year: number;
  month: number; // 1-12
  label: string; // "January", "February", etc.
  categories: ParsedCategory[];
}

// Dashboard types
export interface MonthSummary {
  month: string;
  totalIncome: number;
  totalBills: number;
  totalGas: number;
  totalGroceries: number;
  totalRestaurants: number;
  totalOther: number;
  totalVanguard: number;
  totalUnexpected: number;
  totalSavings: number;
  totalBuffer: number;
  availableFun: number;
  funSpent: number;
  leftoverFun: number;
}

export interface CategoryWithTransactions extends Category {
  transactions: Transaction[];
  total: number;
}

// The 14 default categories in Joel's spreadsheet order
export const DEFAULT_CATEGORIES = [
  { name: 'Income', is_income: true },
  { name: 'Bills', is_income: false },
  { name: 'Gas', is_income: false },
  { name: 'Groceries', is_income: false },
  { name: 'Restaurants', is_income: false },
  { name: 'Other', is_income: false },
  { name: 'Vanguard', is_income: false },
  { name: 'Unexpected Expenses', is_income: false },
  { name: 'Savings', is_income: false },
  { name: 'Buffer Amount', is_income: false },
  { name: 'Available Fun Money', is_income: false },
  { name: "Joel's Fun Spending", is_income: false },
  { name: 'Leftover Fun Money', is_income: false },
] as const;
