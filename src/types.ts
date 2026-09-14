export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // ISO date string YYYY-MM-DD
  type: TransactionType;
  notes?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // YYYY-MM
}

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}
