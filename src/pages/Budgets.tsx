import { useState, useMemo } from 'react';
import { useApp } from '../context';
import { formatCurrency, currentMonth } from '../store';
import { format, subMonths } from 'date-fns';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Budgets() {
  const { data, upsertBgt, deleteBgt } = useApp();
  const { categories, transactions, budgets } = data;

  const [month, setMonth] = useState(currentMonth());

  const expenseCats = categories.filter(c => c.type === 'expense');

  const monthTxs = useMemo(() =>
    transactions.filter(t => t.type === 'expense' && t.date.startsWith(month)),
    [transactions, month]);

  function spent(catId: string) {
    return monthTxs.filter(t => t.categoryId === catId).reduce((s, t) => s + t.amount, 0);
  }

  function getBudget(catId: string) {
    return budgets.find(b => b.categoryId === catId && b.month === month);
  }

  function handleChange(catId: string, value: string) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      const existing = getBudget(catId);
      if (existing) deleteBgt(existing.id);
      return;
    }
    upsertBgt({ categoryId: catId, month, amount: Math.round(num * 100) / 100 });
  }

  function prevMonth() {
    setMonth(format(subMonths(new Date(month + '-01'), 1), 'yyyy-MM'));
  }

  function nextMonth() {
    const next = format(new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1)), 'yyyy-MM');
    if (next <= currentMonth()) setMonth(next);
  }

  const totalBudget = budgets.filter(b => b.month === month).reduce((s, b) => s + b.amount, 0);
  const totalSpent = expenseCats.reduce((s, c) => s + spent(c.id), 0);
  const totalPct = totalBudget ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Month nav */}
      <div className="flex items-center justify-between card px-5 py-3">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-slate-800">
          {format(new Date(month + '-01'), 'MMMM yyyy')}
        </span>
        <button
          onClick={nextMonth}
          disabled={month >= currentMonth()}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Overall progress */}
      {totalBudget > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Budget</span>
            <span className="text-sm text-slate-500">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${totalPct >= 100 ? 'bg-red-500' : totalPct >= 80 ? 'bg-amber-400' : 'bg-blue-500'}`}
              style={{ width: `${totalPct}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">{totalPct.toFixed(0)}% used · {formatCurrency(Math.max(totalBudget - totalSpent, 0))} remaining</div>
        </div>
      )}

      {/* Per-category budgets */}
      <div className="space-y-3">
        {expenseCats.map(cat => {
          const budget = getBudget(cat.id);
          const s = spent(cat.id);
          const pct = budget ? Math.min((s / budget.amount) * 100, 100) : 0;
          const over = budget && s > budget.amount;
          const warn = budget && pct >= 80 && !over;

          return (
            <div key={cat.id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{cat.name}</div>
                  <div className="text-xs text-slate-400">
                    Spent: {formatCurrency(s)}
                    {budget ? ` / Budget: ${formatCurrency(budget.amount)}` : ' (no budget set)'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {over && <AlertTriangle size={16} className="text-red-500" />}
                  {warn && <AlertTriangle size={16} className="text-amber-400" />}
                  {budget && !over && !warn && s > 0 && <CheckCircle size={16} className="text-emerald-500" />}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Budget…"
                      className="input pl-6 w-28 text-sm"
                      defaultValue={budget?.amount ?? ''}
                      key={`${cat.id}-${month}`}
                      onBlur={e => handleChange(cat.id, e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {budget && (
                <div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{pct.toFixed(0)}% used</span>
                    <span>{over ? `${formatCurrency(s - budget.amount)} over` : `${formatCurrency(budget.amount - s)} left`}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Click the budget field and tab away to save. Clear the field to remove a budget.
      </p>
    </div>
  );
}
