import { useState, useMemo } from 'react';
import { useApp } from '../context';
import { formatCurrency } from '../store';
import { format, getDaysInMonth, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Calendar } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';
import { useAutoExport } from '../utils/useAutoExport';

export default function Reports() {
  const { data } = useApp();
  const { transactions, categories } = data;

  const [year, setYear]         = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);
  const [autoExport, setAutoExport] = useState(false);
  // Daily view state
  const [dailyMonth, setDailyMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  const autoStatus = useAutoExport(data, autoExport);

  async function handleExport() {
    setExporting(true);
    try { await exportToExcel(data); } finally { setExporting(false); }
  }

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);

  // ── Monthly summary (year view) ───────────────────────────────────────────
  const monthly = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = `${year}-${String(i + 1).padStart(2, '0')}`;
      const txs = transactions.filter(tx => tx.date.startsWith(m));
      const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const income   = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      return { name: format(new Date(`${m}-01`), 'MMM'), expenses, income, savings: income - expenses };
    });
  }, [transactions, year]);

  // ── Category breakdown (year view) ────────────────────────────────────────
  const byCat = useMemo(() => {
    const txs = transactions.filter(t => t.type === 'expense' && t.date.startsWith(String(year)));
    const map: Record<string, number> = {};
    txs.forEach(t => { map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount; });
    return Object.entries(map)
      .map(([id, value]) => ({ name: catMap[id]?.name ?? 'Other', value, color: catMap[id]?.color ?? '#94a3b8' }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, year, catMap]);

  const totalExpenses = monthly.reduce((s, m) => s + m.expenses, 0);
  const totalIncome   = monthly.reduce((s, m) => s + m.income, 0);
  const avgMonthly    = totalExpenses / 12;

  const topExpenses = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(String(year)))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
    [transactions, year]);

  // ── Daily spend (selected month) ──────────────────────────────────────────
  const [dailyYear, dailyMonthNum] = dailyMonth.split('-').map(Number);
  const dailyMonthDate = new Date(dailyYear, (dailyMonthNum ?? 1) - 1, 1);

  const daily = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(dailyMonthDate),
      end:   endOfMonth(dailyMonthDate),
    });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayTxs  = transactions.filter(t => t.date === dateStr);
      const spent   = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const income  = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      return {
        date:    dateStr,
        day:     format(day, 'd'),
        dayName: format(day, 'EEE'),
        spent,
        income,
        txs:     dayTxs,
      };
    });
  }, [transactions, dailyMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const dailyTotalSpent  = daily.reduce((s, d) => s + d.spent,  0);
  const dailyTotalIncome = daily.reduce((s, d) => s + d.income, 0);
  const activeDays       = daily.filter(d => d.spent > 0).length;
  const avgPerActiveDay  = activeDays ? dailyTotalSpent / activeDays : 0;
  const maxDailySpend    = Math.max(...daily.map(d => d.spent), 0);

  // Month navigation helpers
  function shiftMonth(delta: number) {
    const d = new Date(`${dailyMonth}-01`);
    d.setMonth(d.getMonth() + delta);
    setDailyMonth(d.toISOString().slice(0, 7));
  }
  const isCurrentMonth = dailyMonth === new Date().toISOString().slice(0, 7);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">

      {/* Top bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-between card px-5 py-3 flex-shrink-0">
          <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-slate-100 rounded-xl"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-slate-800 px-2">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-30"
          ><ChevronRight size={18} /></button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setAutoExport(v => !v)}
            disabled={transactions.length === 0}
            title={autoExport ? 'Auto-export ON' : 'Enable auto-export'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] border ${
              autoExport
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-40`}
          >
            <RefreshCw size={15} className={autoStatus === 'exporting' ? 'animate-spin' : ''} />
            {autoExport
              ? autoStatus === 'exporting' ? 'Exporting…' : autoStatus === 'done' ? 'Saved ✓' : autoStatus === 'error' ? 'Error' : 'Auto ON'
              : 'Auto'}
          </button>
          <button className="btn-primary" onClick={handleExport} disabled={exporting || transactions.length === 0}>
            <Download size={16} />{exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Income',   value: formatCurrency(totalIncome),              color: 'text-emerald-500' },
          { label: 'Total Expenses', value: formatCurrency(totalExpenses),             color: 'text-red-500' },
          { label: 'Net Savings',    value: formatCurrency(totalIncome - totalExpenses), color: totalIncome - totalExpenses >= 0 ? 'text-blue-600' : 'text-orange-500' },
          { label: 'Avg / Month',    value: formatCurrency(avgMonthly),                color: 'text-slate-700' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Income vs Expenses — {year}</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: unknown, name: unknown) => [formatCurrency(v as number), typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : '']) as any}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Bar dataKey="income"   fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── DAILY SPEND SECTION ──────────────────────────────────────────────── */}
      <div className="card p-5">
        {/* Header + month nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-700">Daily Spend</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftMonth(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg touch-manipulation">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[96px] text-center">
              {format(dailyMonthDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => shiftMonth(1)}
              disabled={isCurrentMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg touch-manipulation disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Daily summary stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Spent',     value: formatCurrency(dailyTotalSpent),  color: 'text-red-500' },
            { label: 'Total Income',    value: formatCurrency(dailyTotalIncome), color: 'text-emerald-500' },
            { label: 'Days with Spend', value: `${activeDays} / ${getDaysInMonth(dailyMonthDate)}`, color: 'text-slate-700' },
            { label: 'Avg Active Day',  value: formatCurrency(avgPerActiveDay),  color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3">
              <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Daily bar chart */}
        {dailyTotalSpent === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            No expenses in {format(dailyMonthDate, 'MMMM yyyy')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((v: unknown) => [formatCurrency(v as number), 'Spent']) as any}
                labelFormatter={(label: unknown) => {
                  const d = daily.find(x => x.day === String(label));
                  return d ? `${d.dayName} ${d.day} ${format(dailyMonthDate, 'MMM')}` : String(label);
                }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                {daily.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.spent >= maxDailySpend * 0.8 ? '#ef4444' : entry.spent > 0 ? '#3b82f6' : '#e2e8f0'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Day-by-day list — only days with activity */}
        {(() => {
          const activeDaysList = daily.filter(d => d.spent > 0 || d.income > 0);
          if (activeDaysList.length === 0) return null;
          return (
            <div className="mt-5 space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Day-by-day breakdown</p>
              {activeDaysList.sort((a, b) => b.date.localeCompare(a.date)).map(day => (
                <div key={day.date}>
                  {/* Day header row */}
                  <div className="flex items-center gap-3 py-2 border-t border-slate-100 first:border-0">
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-xs text-slate-400">{day.dayName}</div>
                      <div className="text-base font-bold text-slate-800">{day.day}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-3 text-xs">
                        {day.spent > 0 && (
                          <span className="text-red-500 font-semibold">−{formatCurrency(day.spent)}</span>
                        )}
                        {day.income > 0 && (
                          <span className="text-emerald-500 font-semibold">+{formatCurrency(day.income)}</span>
                        )}
                        <span className="text-slate-400">{day.txs.length} transaction{day.txs.length !== 1 ? 's' : ''}</span>
                      </div>
                      {/* Spend bar */}
                      {day.spent > 0 && maxDailySpend > 0 && (
                        <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(day.spent / maxDailySpend) * 100}%`,
                              backgroundColor: day.spent >= maxDailySpend * 0.8 ? '#ef4444' : '#3b82f6',
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className={`text-sm font-bold flex-shrink-0 ${day.spent >= maxDailySpend * 0.8 ? 'text-red-500' : 'text-slate-700'}`}>
                      {day.spent > 0 ? formatCurrency(day.spent) : formatCurrency(day.income)}
                    </div>
                  </div>
                  {/* Individual transactions for that day */}
                  {day.txs.map(tx => {
                    const cat = catMap[tx.categoryId];
                    return (
                      <div key={tx.id} className="flex items-center gap-2 pl-14 py-1">
                        <span className="text-base">{cat?.icon ?? '💸'}</span>
                        <span className="flex-1 text-xs text-slate-500 truncate">{tx.description}</span>
                        <span className={`text-xs font-medium ${tx.type === 'expense' ? 'text-red-400' : 'text-emerald-500'}`}>
                          {tx.type === 'expense' ? '−' : '+'}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── CATEGORY + TOP EXPENSES ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Expenses by Category — {year}</h2>
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
                      <div className="text-xs text-slate-400">{cat?.name} · {format(parseISO(tx.date), 'MMM d')}</div>
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
