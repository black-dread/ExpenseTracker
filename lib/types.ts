export interface Account {
  id: number;
  name: string;
  account_type: 'bank' | 'credit_card' | 'cash' | 'investment' | 'virtual';
  balance: number;
  is_virtual: boolean;
  include_in_net_worth: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type?: string;
  created_at: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer' | 'debt';
export type DebtType = 'lending' | 'borrowing' | 'sending' | 'receiving';

export interface Transaction {
  id: number;
  date: string;
  name: string;
  category_id?: number;
  amount: number;
  transaction_type: TransactionType;
  
  // Income
  income_account_id?: number;
  
  // Expense
  expense_account_id?: number;
  expense_instrument?: string;
  
  // Transfer
  outflow_account_id?: number;
  inflow_account_id?: number;
  
  // Debt
  debt_type?: DebtType;
  involved_account_id?: number;
  counterparty_name?: string;
  
  is_benki: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithDetails extends Transaction {
  category_name?: string;
  income_account_name?: string;
  expense_account_name?: string;
  outflow_account_name?: string;
  inflow_account_name?: string;
  involved_account_name?: string;
}

export interface CreateTransactionDTO {
  date: string;
  name: string;
  category_id?: number;
  amount: number;
  transaction_type: TransactionType;
  
  income_account_id?: number;
  expense_account_id?: number;
  expense_instrument?: string;
  outflow_account_id?: number;
  inflow_account_id?: number;
  debt_type?: DebtType;
  involved_account_id?: number;
  counterparty_name?: string;
  is_benki?: boolean;
  notes?: string;
}

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  categoryBreakdown: { category: string; amount: number }[];
  netWorthHistory: { date: string; net_worth: number }[];
}
