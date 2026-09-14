import type { AppData, Category, Transaction, Budget } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'expense-tracker-data';

const DEFAULT_CATEGORIES: Category[] = [
  { id: uuidv4(), name: 'Food & Dining', color: '#f97316', icon: '🍔', type: 'expense' },
  { id: uuidv4(), name: 'Transport', color: '#3b82f6', icon: '🚗', type: 'expense' },
  { id: uuidv4(), name: 'Shopping', color: '#8b5cf6', icon: '🛍️', type: 'expense' },
  { id: uuidv4(), name: 'Entertainment', color: '#ec4899', icon: '🎬', type: 'expense' },
  { id: uuidv4(), name: 'Health', color: '#10b981', icon: '💊', type: 'expense' },
  { id: uuidv4(), name: 'Utilities', color: '#f59e0b', icon: '💡', type: 'expense' },
  { id: uuidv4(), name: 'Rent / Housing', color: '#6366f1', icon: '🏠', type: 'expense' },
  { id: uuidv4(), name: 'Subscriptions', color: '#14b8a6', icon: '📱', type: 'expense' },
  { id: uuidv4(), name: 'Education', color: '#84cc16', icon: '📚', type: 'expense' },
  { id: uuidv4(), name: 'Personal Care', color: '#f43f5e', icon: '💅', type: 'expense' },
  { id: uuidv4(), name: 'Salary', color: '#22c55e', icon: '💼', type: 'income' },
  { id: uuidv4(), name: 'Freelance', color: '#06b6d4', icon: '💻', type: 'income' },
  { id: uuidv4(), name: 'Investment', color: '#a855f7', icon: '📈', type: 'income' },
  { id: uuidv4(), name: 'Other Income', color: '#64748b', icon: '💰', type: 'income' },
];

const DEFAULT_DATA: AppData = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  budgets: [],
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as AppData;
    return {
      transactions: parsed.transactions ?? [],
      categories: parsed.categories ?? DEFAULT_CATEGORIES,
      budgets: parsed.budgets ?? [],
    };
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return uuidv4();
}

// ── Transaction helpers ────────────────────────────────────────────────────
export function addTransaction(data: AppData, tx: Omit<Transaction, 'id'>): AppData {
  const updated = { ...data, transactions: [{ ...tx, id: generateId() }, ...data.transactions] };
  saveData(updated);
  return updated;
}

export function updateTransaction(data: AppData, tx: Transaction): AppData {
  const updated = { ...data, transactions: data.transactions.map(t => t.id === tx.id ? tx : t) };
  saveData(updated);
  return updated;
}

export function deleteTransaction(data: AppData, id: string): AppData {
  const updated = { ...data, transactions: data.transactions.filter(t => t.id !== id) };
  saveData(updated);
  return updated;
}

// ── Category helpers ───────────────────────────────────────────────────────
export function addCategory(data: AppData, cat: Omit<Category, 'id'>): AppData {
  const updated = { ...data, categories: [...data.categories, { ...cat, id: generateId() }] };
  saveData(updated);
  return updated;
}

export function updateCategory(data: AppData, cat: Category): AppData {
  const updated = { ...data, categories: data.categories.map(c => c.id === cat.id ? cat : c) };
  saveData(updated);
  return updated;
}

export function deleteCategory(data: AppData, id: string): AppData {
  const updated = { ...data, categories: data.categories.filter(c => c.id !== id) };
  saveData(updated);
  return updated;
}

// ── Budget helpers ─────────────────────────────────────────────────────────
export function upsertBudget(data: AppData, budget: Omit<Budget, 'id'> & { id?: string }): AppData {
  const existing = data.budgets.find(b => b.categoryId === budget.categoryId && b.month === budget.month);
  let budgets: Budget[];
  if (existing) {
    budgets = data.budgets.map(b => b.id === existing.id ? { ...b, amount: budget.amount } : b);
  } else {
    budgets = [...data.budgets, { ...budget, id: generateId() }];
  }
  const updated = { ...data, budgets };
  saveData(updated);
  return updated;
}

export function deleteBudget(data: AppData, id: string): AppData {
  const updated = { ...data, budgets: data.budgets.filter(b => b.id !== id) };
  saveData(updated);
  return updated;
}

// ── Utility ────────────────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
