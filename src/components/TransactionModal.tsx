import { useState } from 'react';
import { X } from 'lucide-react';
import type { Transaction, Category } from '../types';

interface Props {
  categories: Category[];
  initial?: Transaction | null;
  onSave: (tx: Omit<Transaction, 'id'> | Transaction) => void;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionModal({ categories, initial, onSave, onClose }: Props) {
  const [type, setType] = useState<'expense' | 'income'>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [date, setDate] = useState(initial?.date ?? today());
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const filtered = categories.filter(c => c.type === type);
  // Derive effective categoryId — if current selection is from wrong type, fall back to first of filtered
  const effectiveCategoryId = filtered.find(c => c.id === categoryId) ? categoryId : (filtered[0]?.id ?? '');

  function handleTypeChange(t: 'expense' | 'income') {
    setType(t);
    // Reset to first category of the new type
    const firstOfType = categories.find(c => c.type === t);
    if (firstOfType) setCategoryId(firstOfType.id);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || !description.trim() || !effectiveCategoryId) return;
    const payload = {
      ...(initial ? { id: initial.id } : {}),
      type,
      amount: Math.round(num * 100) / 100,
      description: description.trim(),
      categoryId: effectiveCategoryId,
      date,
      notes: notes.trim() || undefined,
    };
    onSave(payload as Transaction);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="card w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            {initial ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                type === t
                  ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                className="input pl-7"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <input
              className="input"
              type="text"
              placeholder="What was this for?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={effectiveCategoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select category…</option>
              {filtered.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Any extra details…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 justify-center font-medium px-4 py-2 rounded-xl transition-colors text-white flex items-center gap-2 ${
                type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {initial ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
