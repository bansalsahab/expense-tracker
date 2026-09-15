import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import type { AppData, Transaction, Category, Budget } from './types';
import {
  loadData, addTransaction, updateTransaction, deleteTransaction,
  addCategory, updateCategory, deleteCategory, upsertBudget, deleteBudget,
  syncToFile,
} from './store';
import { supabase } from './lib/supabase';
import { useAuth } from './auth/AuthContext';

interface AppContextValue {
  data: AppData;
  loading: boolean;
  addTx:    (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTx: (tx: Transaction) => Promise<void>;
  deleteTx: (id: string) => Promise<void>;
  addCat:   (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCat:(cat: Category) => Promise<void>;
  deleteCat:(id: string) => Promise<void>;
  upsertBgt:(b: Omit<Budget, 'id'>) => Promise<void>;
  deleteBgt:(id: string) => Promise<void>;
}

const EMPTY: AppData = { transactions: [], categories: [], budgets: [] };
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(EMPTY);
  const [loading, setLoading] = useState(true);

  // Load data when user logs in
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    if (!user) { setData(EMPTY); setLoading(false); return; }
    setLoading(true);
    loadData(user.id).then(d => { setData(d); syncToFile(d); setLoading(false); });
  }, [user]);

  // Real-time subscription — reload on any change from another device
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user-data-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => {
        loadData(user.id).then(d => { setData(d); syncToFile(d); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` }, () => {
        loadData(user.id).then(d => { setData(d); syncToFile(d); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` }, () => {
        loadData(user.id).then(d => { setData(d); syncToFile(d); });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addTx = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const created = await addTransaction(user.id, tx);
    setData(d => ({ ...d, transactions: [created, ...d.transactions] }));
  }, [user]);

  const updateTx = useCallback(async (tx: Transaction) => {
    if (!user) return;
    await updateTransaction(user.id, tx);
    setData(d => ({ ...d, transactions: d.transactions.map(t => t.id === tx.id ? tx : t) }));
  }, [user]);

  const deleteTx = useCallback(async (id: string) => {
    if (!user) return;
    await deleteTransaction(user.id, id);
    setData(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }));
  }, [user]);

  const addCat = useCallback(async (cat: Omit<Category, 'id'>) => {
    if (!user) return;
    const created = await addCategory(user.id, cat);
    setData(d => ({ ...d, categories: [...d.categories, created] }));
  }, [user]);

  const updateCat = useCallback(async (cat: Category) => {
    if (!user) return;
    await updateCategory(user.id, cat);
    setData(d => ({ ...d, categories: d.categories.map(c => c.id === cat.id ? cat : c) }));
  }, [user]);

  const deleteCat = useCallback(async (id: string) => {
    if (!user) return;
    await deleteCategory(user.id, id);
    setData(d => ({ ...d, categories: d.categories.filter(c => c.id !== id) }));
  }, [user]);

  const upsertBgt = useCallback(async (b: Omit<Budget, 'id'>) => {
    if (!user) return;
    const saved = await upsertBudget(user.id, b);
    setData(d => {
      const existing = d.budgets.find(x => x.categoryId === b.categoryId && x.month === b.month);
      return {
        ...d,
        budgets: existing
          ? d.budgets.map(x => x.id === existing.id ? saved : x)
          : [...d.budgets, saved],
      };
    });
  }, [user]);

  const deleteBgt = useCallback(async (id: string) => {
    if (!user) return;
    await deleteBudget(user.id, id);
    setData(d => ({ ...d, budgets: d.budgets.filter(b => b.id !== id) }));
  }, [user]);

  return (
    <AppContext.Provider value={{ data, loading, addTx, updateTx, deleteTx, addCat, updateCat, deleteCat, upsertBgt, deleteBgt }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
