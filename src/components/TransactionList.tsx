import type { Transaction, Category } from '../types';
import { formatCurrency } from '../store';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({ transactions, categories, onEdit, onDelete }: Props) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  if (!transactions.length) {
    return (
      <div className="text-center py-16 text-slate-400">
        <div className="text-4xl mb-3">📭</div>
        <p className="font-medium">No transactions yet</p>
        <p className="text-sm">Add your first transaction to get started</p>
      </div>
    );
  }

  // Group by date
  const groups: Map<string, Transaction[]> = new Map();
  for (const tx of transactions) {
    const key = tx.date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([date, txs]) => (
        <div key={date}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
            {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="card divide-y divide-slate-100">
            {txs.map(tx => {
              const cat = catMap[tx.categoryId];
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: cat ? cat.color + '20' : '#f1f5f9' }}
                  >
                    {cat?.icon ?? '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{tx.description}</div>
                    <div className="text-xs text-slate-400">{cat?.name ?? 'Unknown'}</div>
                  </div>
                  {tx.notes && (
                    <div className="text-xs text-slate-400 hidden sm:block max-w-[120px] truncate">
                      {tx.notes}
                    </div>
                  )}
                  <div className={`font-semibold text-sm ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
