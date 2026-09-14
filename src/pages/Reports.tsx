import { useState, useMemo } from 'react';
import { useApp } from '../context';
import { formatCurrency } from '../store';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Reports() {
  const { data } = useApp();
  const { transactions, categories } = data;

  const [year, setYear] = useState(new Date().getFullYear());
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);

  // Monthly summary for the selected year
  const monthly = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = `${year}-${String(i + 1).padStart(2, '0')}`;
      const txs = transactions.filter(tx => tx.date.startsWith(m));
      const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      return { name: format(new Date(`${m}-01`), 'MMM'), expenses, income, savings: income - expenses };
    });
  }, [transactions, year]);

  // Category breakdown for the year
  const byCat = useMemo(() => {
    const txs = transactions.filter(t => t.type === 'expense' && t.date.startsWith(String(year)));
    const map: Record<string, number> = {};
    txs.forEach(t => { map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount; });
    return Object.entries(map)
      .map(([id, value]) => ({ name: catMap[id]?.name ?? 'Other', value, color: catMap[id]?.color ?? '#94a3b8' }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, year, catMap]);

  const totalExpenses = monthly.reduce((s, m) => s + m.expenses, 0);
  const totalIncome = monthly.reduce((s, m) => s + m.income, 0);
  const avgMonthly = totalExpenses / 12;

  // Top 5 individual expenses
  const topExpenses = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(String(year)))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
    [transactions, year]);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Year nav */}
      <div className="flex items-center justify-between card px-5 py-3 max-w-xs">
        <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-slate-100 rounded-xl">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-slate-800">{year}</span>
        <button
          onClick={() => setYear(y => y + 1)}
          disabled={year >= new Date().getFullYear()}
          className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Income', value: formatCurrency(totalIncome), color: 'text-emerald-500' },
          { label: 'Total Expenses', value: formatCurrency(totalExpenses), color: 'text-red-500' },
          { label: 'Net Savings', value: formatCurrency(totalIncome - totalExpenses), color: totalIncome - totalExpenses >= 0 ? 'text-blue-600' : 'text-orange-500' },
          { label: 'Avg / Month', value: formatCurrency(avgMonthly), color: 'text-slate-700' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Income vs Expenses</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: unknown, name: unknown) => [formatCurrency(v as number), typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : '']) as any}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Expenses by Category</h2>
          {byCat.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No expense data for {year}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byCat} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                    {byCat.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => [formatCurrency(v as number)]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {byCat.slice(0, 6).map(c => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-xs text-slate-600 flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-medium text-slate-700">{formatCurrency(c.value)}</span>
                    <span className="text-xs text-slate-400 w-10 text-right">
                      {totalExpenses ? ((c.value / totalExpenses) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top expenses */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Top Expenses in {year}</h2>
          {topExpenses.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No data</div>
          ) : (
            <div className="space-y-3">
              {topExpenses.map((tx, i) => {
                const cat = catMap[tx.categoryId];
                return (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div className="text-lg font-bold text-slate-200 w-6 flex-shrink-0">{i + 1}</div>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: cat?.color ? cat.color + '20' : '#f1f5f9' }}
                    >
                      {cat?.icon ?? '💸'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{tx.description}</div>
                      <div className="text-xs text-slate-400">{cat?.name} · {format(new Date(tx.date + 'T00:00:00'), 'MMM d')}</div>
                    </div>
                    <div className="text-sm font-bold text-red-500">{formatCurrency(tx.amount)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
