import type { AppData, Category, Transaction, Budget } from './types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';

// ── Default categories seeded for new users ─────────────────────────────────
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food & Dining',  color: '#f97316', icon: '🍔', type: 'expense' },
  { name: 'Transport',      color: '#3b82f6', icon: '🚗', type: 'expense' },
  { name: 'Shopping',       color: '#8b5cf6', icon: '🛍️', type: 'expense' },
  { name: 'Entertainment',  color: '#ec4899', icon: '🎬', type: 'expense' },
  { name: 'Health',         color: '#10b981', icon: '💊', type: 'expense' },
  { name: 'Utilities',      color: '#f59e0b', icon: '💡', type: 'expense' },
  { name: 'Rent / Housing', color: '#6366f1', icon: '🏠', type: 'expense' },
  { name: 'Subscriptions',  color: '#14b8a6', icon: '📱', type: 'expense' },
  { name: 'Education',      color: '#84cc16', icon: '📚', type: 'expense' },
  { name: 'Personal Care',  color: '#f43f5e', icon: '💅', type: 'expense' },
  { name: 'Salary',         color: '#22c55e', icon: '💼', type: 'income'  },
  { name: 'Freelance',      color: '#06b6d4', icon: '💻', type: 'income'  },
  { name: 'Investment',     color: '#a855f7', icon: '📈', type: 'income'  },
  { name: 'Other Income',   color: '#64748b', icon: '💰', type: 'income'  },
];

export function generateId(): string { return uuidv4(); }

// ── Load all data for user ─────────────────────────────────────────────────
export async function loadData(userId: string): Promise<AppData> {
  const [catRes, txRes, budRes] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('budgets').select('*').eq('user_id', userId),
  ]);

  const categories: Category[] = (catRes.data ?? []).map(r => ({
    id: r.id, name: r.name, color: r.color, icon: r.icon, type: r.type,
  }));

  // Seed default categories if brand new user
  if (categories.length === 0) {
    const seeds = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId, id: uuidv4() }));
    await supabase.from('categories').insert(seeds);
    return {
      transactions: [],
      categories: seeds.map(({ user_id: _u, ...rest }) => rest) as Category[],
      budgets: [],
    };
  }

  const transactions: Transaction[] = (txRes.data ?? []).map(r => ({
    id: r.id,
    amount: Number(r.amount),
    description: r.description,
    categoryId: r.category_id ?? '',
    date: r.date,
    type: r.type,
    notes: r.notes ?? undefined,
  }));

  const budgets: Budget[] = (budRes.data ?? []).map(r => ({
    id: r.id,
    categoryId: r.category_id ?? '',
    amount: Number(r.amount),
    month: r.month,
  }));

  return { transactions, categories, budgets };
}

// ── Transaction CRUD ──────────────────────────────────────────────────────────
export async function addTransaction(
  userId: string, tx: Omit<Transaction, 'id'>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id:     userId,
      amount:      tx.amount,
      description: tx.description,
      category_id: tx.categoryId || null,
      date:        tx.date,
      type:        tx.type,
      notes:       tx.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id, amount: Number(data.amount), description: data.description,
    categoryId: data.category_id ?? '', date: data.date, type: data.type,
    notes: data.notes ?? undefined,
  };
}

export async function updateTransaction(
  userId: string, tx: Transaction
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      amount:      tx.amount,
      description: tx.description,
      category_id: tx.categoryId || null,
      date:        tx.date,
      type:        tx.type,
      notes:       tx.notes ?? null,
    })
    .eq('id', tx.id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ── Category CRUD ─────────────────────────────────────────────────────────────
export async function addCategory(
  userId: string, cat: Omit<Category, 'id'>
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, ...cat })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, color: data.color, icon: data.icon, type: data.type };
}

export async function updateCategory(userId: string, cat: Category): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ name: cat.name, color: cat.color, icon: cat.icon, type: cat.type })
    .eq('id', cat.id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ── Budget CRUD ───────────────────────────────────────────────────────────────
export async function upsertBudget(
  userId: string, b: Omit<Budget, 'id'>
): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: userId, category_id: b.categoryId, amount: b.amount, month: b.month },
      { onConflict: 'user_id,category_id,month' }
    )
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, categoryId: data.category_id, amount: Number(data.amount), month: data.month };
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ── Utility ───────────────────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// ── MCP file sync (dev only) ──────────────────────────────────────────────────
export function syncToFile(data: AppData): void {
  if (typeof window === 'undefined') return;
  fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => { /* silently ignore — dev only */ });
}
