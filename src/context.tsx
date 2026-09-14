import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AppData, Transaction, Category, Budget } from './types';
import {
  loadData, addTransaction, updateTransaction, deleteTransaction,
  addCategory, updateCategory, deleteCategory, upsertBudget, deleteBudget,
} from './store';

interface AppContextValue {
  data: AppData;
  addTx: (tx: Omit<Transaction, 'id'>) => void;
  updateTx: (tx: Transaction) => void;
  deleteTx: (id: string) => void;
  addCat: (cat: Omit<Category, 'id'>) => void;
  updateCat: (cat: Category) => void;
  deleteCat: (id: string) => void;
  upsertBgt: (b: Omit<Budget, 'id'> & { id?: string }) => void;
  deleteBgt: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  const addTx = useCallback((tx: Omit<Transaction, 'id'>) => setData(d => addTransaction(d, tx)), []);
  const updateTx = useCallback((tx: Transaction) => setData(d => updateTransaction(d, tx)), []);
  const deleteTx = useCallback((id: string) => setData(d => deleteTransaction(d, id)), []);
  const addCat = useCallback((cat: Omit<Category, 'id'>) => setData(d => addCategory(d, cat)), []);
  const updateCat = useCallback((cat: Category) => setData(d => updateCategory(d, cat)), []);
  const deleteCat = useCallback((id: string) => setData(d => deleteCategory(d, id)), []);
  const upsertBgt = useCallback((b: Omit<Budget, 'id'> & { id?: string }) => setData(d => upsertBudget(d, b)), []);
  const deleteBgt = useCallback((id: string) => setData(d => deleteBudget(d, id)), []);

  return (
    <AppContext.Provider value={{ data, addTx, updateTx, deleteTx, addCat, updateCat, deleteCat, upsertBgt, deleteBgt }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
