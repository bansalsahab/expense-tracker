import { useState, useMemo } from 'react';
import { useApp } from '../context';
import type { Transaction } from '../types';
import TransactionModal from '../components/TransactionModal';
import TransactionList from '../components/TransactionList';
import { formatCurrency } from '../store';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function Expenses() {
  const { data, addTx, updateTx, deleteTx } = useApp();
  const { transactions, categories } = data;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCat, setFilterCat] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const monthOptions = useMemo(() => {
    const months = new Set(transactions.map(t => t.date.slice(0, 7)));
    return [...months].sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter(tx => {
        if (filterType !== 'all' && tx.type !== filterType) return false;
        if (filterCat && tx.categoryId !== filterCat) return false;
        if (filterMonth && !tx.date.startsWith(filterMonth)) return false;
        if (search) {
          const s = search.toLowerCase();
          const cat = data.categories.find(c => c.id === tx.categoryId);
          return (
            tx.description.toLowerCase().includes(s) ||
            (cat?.name.toLowerCase().includes(s) ?? false) ||
            tx.amount.toString().includes(s)
          );
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterType, filterCat, filterMonth, search, data.categories]);

  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  function handleEdit(tx: Transaction) {
    setEditing(tx);
    setShowModal(true);
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this transaction?')) deleteTx(id);
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-3">
          <div className="card px-4 py-2 text-center">
            <div className="text-xs text-slate-400">Expenses</div>
            <div className="text-base font-bold text-red-500">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-xs text-slate-400">Income</div>
            <div className="text-base font-bold text-emerald-500">{formatCurrency(totalIncome)}</div>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditing(null); setShowModal(true); }}
        >
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-8"
            placeholder="Search transactions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto min-w-[120px]" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <select className="input w-auto min-w-[140px]" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {data.categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <select className="input w-auto min-w-[130px]" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">All months</option>
          {monthOptions.map(m => (
            <option key={m} value={m}>{format(new Date(m + '-01'), 'MMM yyyy')}</option>
          ))}
        </select>
        {(search || filterType !== 'all' || filterCat || filterMonth) && (
          <button
            className="btn-secondary text-sm"
            onClick={() => { setSearch(''); setFilterType('all'); setFilterCat(''); setFilterMonth(''); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* List */}
      <TransactionList
        transactions={filtered}
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <TransactionModal
          categories={categories}
          initial={editing}
          onSave={editing ? (tx) => updateTx(tx as Transaction) : (tx) => addTx(tx as Omit<Transaction, 'id'>)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
