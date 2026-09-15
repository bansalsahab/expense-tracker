import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, Zap } from 'lucide-react';
import { useApp } from '../context';
import type { Transaction } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

type Status = 'form' | 'saving' | 'success';

export default function QuickAdd() {
  const { data, addTx } = useApp();
  const navigate = useNavigate();

  const [type, setType]             = useState<'expense' | 'income'>('expense');
  const [amount, setAmount]         = useState('');
  const [description, setDesc]      = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate]             = useState(today());
  const [status, setStatus]         = useState<Status>('form');

  const filtered = data.categories.filter(c => c.type === type);
  const effectiveCatId = filtered.find(c => c.id === categoryId)?.id ?? filtered[0]?.id ?? '';

  function handleTypeChange(t: 'expense' | 'income') {
    setType(t);
    const first = data.categories.find(c => c.type === t);
    if (first) setCategoryId(first.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || !description.trim() || !effectiveCatId) return;

    setStatus('saving');
    const payload: Omit<Transaction, 'id'> = {
      type,
      amount: Math.round(num * 100) / 100,
      description: description.trim(),
      categoryId: effectiveCatId,
      date,
    };

    try {
      await addTx(payload);
      setStatus('success');
      // Auto-close back to dashboard after 1.4 s
      setTimeout(() => navigate('/'), 1400);
    } catch {
      setStatus('form');
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-emerald-500 flex flex-col items-center justify-center gap-4 z-50">
        <CheckCircle className="w-20 h-20 text-white animate-bounce" />
        <p className="text-white text-xl font-semibold">Saved!</p>
        <p className="text-emerald-100 text-sm">Going back to dashboard…</p>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
      <div
        className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl p-6 pb-safe"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Quick Add</h2>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 touch-manipulation"
            aria-label="Close"
          >
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
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                type === t
                  ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                  : 'text-slate-600'
              }`}
            >
              {t === 'expense' ? '💸 Expense' : '💰 Income'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount — large, easy to tap */}
          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                className="input pl-7 text-lg font-semibold"
                type="number"
                inputMode="decimal"
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

          {/* Description */}
          <div>
            <label className="label">What was it for?</label>
            <input
              className="input"
              type="text"
              placeholder="Coffee, groceries, rent…"
              value={description}
              onChange={e => setDesc(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={effectiveCatId}
              onChange={e => setCategoryId(e.target.value)}
              required
            >
              {filtered.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'saving'}
            className={`w-full min-h-[52px] rounded-2xl font-semibold text-white text-base
              transition-all touch-manipulation flex items-center justify-center gap-2
              disabled:opacity-60 ${
                type === 'expense'
                  ? 'bg-red-500 active:bg-red-600'
                  : 'bg-emerald-500 active:bg-emerald-600'
              }`}
          >
            {status === 'saving' ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Zap className="w-4 h-4" /> Save {type === 'expense' ? 'Expense' : 'Income'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
