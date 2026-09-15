import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import type { AppData, Category, Transaction } from './types';

const DATA_DIR = path.join(os.homedir(), '.expense-tracker');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

const DEFAULT_CATEGORIES: Category[] = [
  { id: uuidv4(), name: 'Food & Dining',   color: '#f97316', icon: '🍔', type: 'expense' },
  { id: uuidv4(), name: 'Transport',        color: '#3b82f6', icon: '🚗', type: 'expense' },
  { id: uuidv4(), name: 'Shopping',         color: '#8b5cf6', icon: '🛍️', type: 'expense' },
  { id: uuidv4(), name: 'Entertainment',    color: '#ec4899', icon: '🎬', type: 'expense' },
  { id: uuidv4(), name: 'Health',           color: '#10b981', icon: '💊', type: 'expense' },
  { id: uuidv4(), name: 'Utilities',        color: '#f59e0b', icon: '💡', type: 'expense' },
  { id: uuidv4(), name: 'Rent / Housing',   color: '#6366f1', icon: '🏠', type: 'expense' },
  { id: uuidv4(), name: 'Subscriptions',    color: '#14b8a6', icon: '📱', type: 'expense' },
  { id: uuidv4(), name: 'Education',        color: '#84cc16', icon: '📚', type: 'expense' },
  { id: uuidv4(), name: 'Personal Care',    color: '#f43f5e', icon: '💅', type: 'expense' },
  { id: uuidv4(), name: 'Salary',           color: '#22c55e', icon: '💼', type: 'income' },
  { id: uuidv4(), name: 'Freelance',        color: '#06b6d4', icon: '💻', type: 'income' },
  { id: uuidv4(), name: 'Investment',       color: '#a855f7', icon: '📈', type: 'income' },
  { id: uuidv4(), name: 'Other Income',     color: '#64748b', icon: '💰', type: 'income' },
];

const DEFAULT_DATA: AppData = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  budgets: [],
};

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadData(): AppData {
  ensureDataDir();
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as AppData;
    return {
      transactions: parsed.transactions ?? [],
      categories:   parsed.categories   ?? DEFAULT_CATEGORIES,
      budgets:      parsed.budgets       ?? [],
    };
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveData(data: AppData): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId(): string {
  return uuidv4();
}

// ── Transaction helpers ────────────────────────────────────────────────────
export function addTransaction(data: AppData, tx: Omit<Transaction, 'id'>): AppData {
  const updated: AppData = { ...data, transactions: [{ ...tx, id: generateId() }, ...data.transactions] };
  saveData(updated);
  return updated;
}

export function deleteTransaction(data: AppData, id: string): AppData {
  const updated: AppData = { ...data, transactions: data.transactions.filter(t => t.id !== id) };
  saveData(updated);
  return updated;
}

// ── Utilities ─────────────────────────────────────────────────────────────
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getDataFilePath(): string {
  return DATA_FILE;
}
