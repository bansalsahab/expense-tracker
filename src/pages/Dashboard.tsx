import { useMemo } from 'react';
import { useApp } from '../context';
import { formatCurrency, currentMonth } from '../store';
import { format, subMonths } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const { data } = useApp();
  const { transactions, categories } = data;

  const thisMonth = currentMonth();
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);

  const thisMonthTxs = useMemo(() =>
    transactions.filter(tx => tx.date.startsWith(thisMonth)), [transactions, thisMonth]);

  const lastMonthTxs = useMemo(() =>
    transactions.filter(tx => tx.date.startsWith(lastMonth)), [transactions, lastMonth]);

  const thisExpenses = thisMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const thisIncome = thisMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const lastExpenses = lastMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = thisIncome - thisExpenses;

  // Last 6 months bar data
  const last6 = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const m = format(d, 'yyyy-MM');
      const txs = transactions.filter(tx => tx.date.startsWith(m));
      return {
        name: format(d, 'MMM'),
        expenses: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  // Pie: this month expenses by category
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonthTxs.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .map(([id, value]) => ({ name: catMap[id]?.name ?? 'Other', value, color: catMap[id]?.color ?? '#94a3b8' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [thisMonthTxs, catMap]);

  // Recent 5 transactions
  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

  const expenseDiff = lastExpenses ? ((thisExpenses - lastExpenses) / lastExpenses) * 100 : 0;

  const SUMMARY_CARDS = [
    {
      label: 'Income',
      value: formatCurrency(thisIncome),
      icon: TrendingUp,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      sub: format(new Date(), 'MMMM yyyy'),
    },
    {
      label: 'Expenses',
      value: formatCurrency(thisExpenses),
      icon: TrendingDown,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      sub: lastExpenses ? `${expenseDiff > 0 ? '+' : ''}${expenseDiff.toFixed(1)}% vs last month` : 'No data last month',
    },
    {
      label: 'Net Savings',
      value: formatCurrency(savings),
      icon: Wallet,
      iconBg: savings >= 0 ? 'bg-blue-100' : 'bg-orange-100',
      iconColor: savings >= 0 ? 'text-blue-600' : 'text-orange-500',
      sub: thisIncome ? `${((savings / thisIncome) * 100).toFixed(0)}% of income` : '—',
    },
    {
      label: 'Transactions',
      value: String(thisMonthTxs.length),
      icon: ArrowUpRight,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      sub: `${transactions.length} total`,
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map(c => (
          <div key={c.label} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`${c.iconBg} ${c.iconColor} p-2 rounded-xl`}>
                <c.icon size={18} />
              </div>
            </div>
            <div className="text-xl lg:text-2xl font-bold text-slate-900">{c.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{c.label}</div>
            <div className="text-xs text-slate-400 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="card p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Income vs Expenses — Last 6 Months</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={last6} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((v: unknown, name: unknown) => [formatCurrency(v as number), typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : '']) as any}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#income)" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Spending by Category</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              No expenses this month
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown) => [formatCurrency(v as number)]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
          <a href="/expenses" className="text-xs text-blue-600 hover:underline">View all</a>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No transactions yet</div>
        ) : (
          <div className="space-y-1">
            {recent.map(tx => {
              const cat = catMap[tx.categoryId];
              return (
                <div key={tx.id} className="flex items-center gap-3 py-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: cat ? cat.color + '20' : '#f1f5f9' }}
                  >
                    {cat?.icon ?? '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{tx.description}</div>
                    <div className="text-xs text-slate-400">{cat?.name} · {format(new Date(tx.date + 'T00:00:00'), 'MMM d')}</div>
                  </div>
                  <div className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
