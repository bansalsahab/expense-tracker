import path from 'path';
import os from 'os';
import ExcelJS from 'exceljs';
import {
  loadData, addTransaction, deleteTransaction,
  formatUSD, currentMonth,
} from './data';
import type { Transaction } from './types';

// ── add_expense ────────────────────────────────────────────────────────────
export function handleAddExpense(args: Record<string, unknown>) {
  const data = loadData();
  const amount = Number(args['amount']);
  if (isNaN(amount) || amount <= 0) throw new Error('amount must be a positive number');

  const description = String(args['description'] ?? '').trim();
  if (!description) throw new Error('description is required');

  const date = String(args['date'] ?? new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must be YYYY-MM-DD');

  const type = (args['type'] as string) ?? 'expense';
  if (type !== 'expense' && type !== 'income') throw new Error('type must be "expense" or "income"');

  // Resolve category by name or id
  const categoryQuery = String(args['category'] ?? '').toLowerCase();
  const category = data.categories.find(
    c => c.id === categoryQuery || c.name.toLowerCase() === categoryQuery
  );
  if (!category) {
    const names = data.categories.map(c => c.name).join(', ');
    throw new Error(`Category "${args['category']}" not found. Available: ${names}`);
  }

  const paymentMethod = (args['paymentMethod'] as string) ?? undefined;
  const notes = args['notes'] ? String(args['notes']) : undefined;

  const tx: Omit<Transaction, 'id'> = {
    amount: Math.round(amount * 100) / 100,
    description,
    categoryId: category.id,
    date,
    type: type as 'expense' | 'income',
    paymentMethod: paymentMethod as Transaction['paymentMethod'],
    notes,
  };

  const updated = addTransaction(data, tx);
  const added = updated.transactions[0];
  return {
    success: true,
    transaction: added,
    message: `Added ${type}: ${formatUSD(amount)} for "${description}" in ${category.name} on ${date}`,
  };
}

// ── get_expenses ───────────────────────────────────────────────────────────
export function handleGetExpenses(args: Record<string, unknown>) {
  const data = loadData();
  let txs = [...data.transactions];

  const dateFrom = args['dateFrom'] ? String(args['dateFrom']) : null;
  const dateTo   = args['dateTo']   ? String(args['dateTo'])   : null;
  const category = args['category'] ? String(args['category']).toLowerCase() : null;
  const type     = args['type']     ? String(args['type'])     : null;
  const paymentMethod = args['paymentMethod'] ? String(args['paymentMethod']) : null;

  if (dateFrom) txs = txs.filter(t => t.date >= dateFrom);
  if (dateTo)   txs = txs.filter(t => t.date <= dateTo);
  if (type)     txs = txs.filter(t => t.type === type);
  if (paymentMethod) txs = txs.filter(t => (t.paymentMethod ?? '').toLowerCase() === paymentMethod.toLowerCase());
  if (category) {
    const cat = data.categories.find(c => c.id === category || c.name.toLowerCase() === category);
    if (cat) txs = txs.filter(t => t.categoryId === cat.id);
  }

  txs.sort((a, b) => b.date.localeCompare(a.date));

  const catMap = Object.fromEntries(data.categories.map(c => [c.id, c]));
  const enriched = txs.map(t => ({ ...t, categoryName: catMap[t.categoryId]?.name ?? 'Unknown' }));

  return {
    count: enriched.length,
    total: txs.reduce((s, t) => t.type === 'expense' ? s + t.amount : s, 0),
    transactions: enriched,
  };
}

// ── delete_expense ─────────────────────────────────────────────────────────
export function handleDeleteExpense(args: Record<string, unknown>) {
  const id = String(args['id'] ?? '').trim();
  if (!id) throw new Error('id is required');

  const data = loadData();
  const tx = data.transactions.find(t => t.id === id);
  if (!tx) throw new Error(`Transaction with id "${id}" not found`);

  deleteTransaction(data, id);
  return { success: true, message: `Deleted transaction: "${tx.description}" (${formatUSD(tx.amount)})` };
}

// ── get_summary ────────────────────────────────────────────────────────────
export function handleGetSummary(args: Record<string, unknown>) {
  const data = loadData();
  const month = args['month'] ? String(args['month']) : currentMonth();

  const monthTxs = data.transactions.filter(t => t.date.startsWith(month));
  const expenses = monthTxs.filter(t => t.type === 'expense');
  const income   = monthTxs.filter(t => t.type === 'income');

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome  = income.reduce((s, t) => s + t.amount, 0);

  const catMap = Object.fromEntries(data.categories.map(c => [c.id, c]));

  // Category breakdown
  const catBreakdown: Record<string, number> = {};
  for (const t of expenses) {
    const name = catMap[t.categoryId]?.name ?? 'Unknown';
    catBreakdown[name] = (catBreakdown[name] ?? 0) + t.amount;
  }
  const categoryBreakdown = Object.entries(catBreakdown)
    .map(([category, amount]) => ({
      category,
      amount,
      formatted: formatUSD(amount),
      percentage: totalExpense ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly breakdown (last 6 months)
  const monthlyBreakdown = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.toISOString().slice(0, 7);
    const mTxs = data.transactions.filter(t => t.date.startsWith(m));
    return {
      month: m,
      expenses: mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      income:   mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    };
  });

  return {
    month,
    totalExpense,
    totalIncome,
    netSavings: totalIncome - totalExpense,
    totalExpenseFormatted: formatUSD(totalExpense),
    totalIncomeFormatted:  formatUSD(totalIncome),
    netSavingsFormatted:   formatUSD(totalIncome - totalExpense),
    transactionCount: monthTxs.length,
    topCategories: categoryBreakdown.slice(0, 5),
    categoryBreakdown,
    monthlyBreakdown,
  };
}

// ── get_dashboard_stats ────────────────────────────────────────────────────
export function handleGetDashboardStats(_args: Record<string, unknown>) {
  const data = loadData();
  const month = currentMonth();
  const monthTxs = data.transactions.filter(t => t.date.startsWith(month));
  const allExpenses = data.transactions.filter(t => t.type === 'expense');
  const catMap = Object.fromEntries(data.categories.map(c => [c.id, c]));

  const thisMonthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const thisMonthIncome  = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const avg = allExpenses.length ? allExpenses.reduce((s, t) => s + t.amount, 0) / allExpenses.length : 0;
  const highest = allExpenses.reduce<Transaction | null>((max, t) => (!max || t.amount > max.amount ? t : max), null);

  const catBreakdown: Record<string, number> = {};
  for (const t of monthTxs.filter(tx => tx.type === 'expense')) {
    catBreakdown[t.categoryId] = (catBreakdown[t.categoryId] ?? 0) + t.amount;
  }
  const highestCatId = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    currentMonth: month,
    thisMonthExpense:           formatUSD(thisMonthExpense),
    thisMonthIncome:            formatUSD(thisMonthIncome),
    netSavings:                 formatUSD(thisMonthIncome - thisMonthExpense),
    averageTransactionAmount:   formatUSD(avg),
    totalTransactions:          data.transactions.length,
    thisMonthTransactions:      monthTxs.length,
    highestSingleExpense:       highest ? { ...highest, categoryName: catMap[highest.categoryId]?.name } : null,
    highestSpendingCategory:    highestCatId ? catMap[highestCatId]?.name : null,
    recentTransactions:         data.transactions.slice(0, 10).map(t => ({
      ...t, categoryName: catMap[t.categoryId]?.name ?? 'Unknown',
    })),
  };
}

// ── export_to_excel ────────────────────────────────────────────────────────
export async function handleExportToExcel(_args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const data = loadData();
  const catMap = Object.fromEntries(data.categories.map(c => [c.id, c]));
  const totalExp = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Expense Tracker';
  wb.created = new Date();

  const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  const CURRENCY_FMT = '"$"#,##0.00';
  const DATE_FMT = 'DD-MMM-YYYY';

  function styleHeader(row: ExcelJS.Row): void {
    row.eachCell(cell => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF1D4ED8' } } };
    });
    row.height = 22;
  }

  // ── Sheet 1: Transactions ─────────────────────────────────────────────
  const txSheet = wb.addWorksheet('Transactions');
  txSheet.columns = [
    { header: 'Date',           key: 'date',    width: 14 },
    { header: 'Description',    key: 'desc',    width: 34 },
    { header: 'Category',       key: 'cat',     width: 22 },
    { header: 'Type',           key: 'type',    width: 10 },
    { header: 'Amount',         key: 'amount',  width: 14 },
    { header: 'Payment Method', key: 'pm',      width: 18 },
    { header: 'Notes',          key: 'notes',   width: 30 },
  ];
  styleHeader(txSheet.getRow(1));
  txSheet.views = [{ state: 'frozen', ySplit: 1 }];

  for (const t of [...data.transactions].sort((a, b) => b.date.localeCompare(a.date))) {
    const row = txSheet.addRow({
      date:   new Date(t.date + 'T00:00:00'),
      desc:   t.description,
      cat:    catMap[t.categoryId]?.name ?? 'Unknown',
      type:   t.type.charAt(0).toUpperCase() + t.type.slice(1),
      amount: t.type === 'expense' ? -t.amount : t.amount,
      pm:     t.paymentMethod ?? '—',
      notes:  t.notes ?? '',
    });
    row.getCell('date').numFmt   = DATE_FMT;
    row.getCell('amount').numFmt = CURRENCY_FMT;
    row.getCell('amount').font   = { color: { argb: t.type === 'expense' ? 'FFDC2626' : 'FF16A34A' } };
  }

  // ── Sheet 2: Monthly Summary ──────────────────────────────────────────
  const monthMap: Record<string, { expenses: number; income: number; count: number; cats: Record<string, number> }> = {};
  for (const t of data.transactions) {
    const m = t.date.slice(0, 7);
    if (!monthMap[m]) monthMap[m] = { expenses: 0, income: 0, count: 0, cats: {} };
    if (t.type === 'expense') {
      monthMap[m].expenses += t.amount;
      monthMap[m].cats[t.categoryId] = (monthMap[m].cats[t.categoryId] ?? 0) + t.amount;
    } else {
      monthMap[m].income += t.amount;
    }
    monthMap[m].count++;
  }
  const mSheet = wb.addWorksheet('Monthly Summary');
  mSheet.columns = [
    { header: 'Month',                  key: 'month',   width: 12 },
    { header: 'Total Expenses',         key: 'exp',     width: 16 },
    { header: 'Total Income',           key: 'inc',     width: 14 },
    { header: 'Net Savings',            key: 'sav',     width: 14 },
    { header: 'Transactions',           key: 'cnt',     width: 14 },
    { header: 'Avg per Transaction',    key: 'avg',     width: 20 },
    { header: 'Top Category',           key: 'topcat',  width: 22 },
  ];
  styleHeader(mSheet.getRow(1));
  mSheet.views = [{ state: 'frozen', ySplit: 1 }];
  for (const [month, v] of Object.entries(monthMap).sort(([a], [b]) => b.localeCompare(a))) {
    const topCatId = Object.entries(v.cats).sort((a, b) => b[1] - a[1])[0]?.[0];
    const row = mSheet.addRow({
      month, exp: v.expenses, inc: v.income,
      sav: v.income - v.expenses,
      cnt: v.count,
      avg: v.count ? v.expenses / v.count : 0,
      topcat: topCatId ? (catMap[topCatId]?.name ?? '—') : '—',
    });
    (['exp', 'inc', 'sav', 'avg'] as const).forEach(k => { row.getCell(k).numFmt = CURRENCY_FMT; });
  }

  // ── Sheet 3: Category Breakdown ───────────────────────────────────────
  const catAgg: Record<string, { total: number; count: number }> = {};
  for (const t of data.transactions.filter(x => x.type === 'expense')) {
    if (!catAgg[t.categoryId]) catAgg[t.categoryId] = { total: 0, count: 0 };
    catAgg[t.categoryId].total += t.amount;
    catAgg[t.categoryId].count++;
  }
  const cSheet = wb.addWorksheet('Category Breakdown');
  cSheet.columns = [
    { header: 'Category',           key: 'cat',   width: 22 },
    { header: 'Total Amount',       key: 'total', width: 16 },
    { header: '% of Total',         key: 'pct',   width: 12 },
    { header: 'Transactions',       key: 'cnt',   width: 14 },
    { header: 'Average Amount',     key: 'avg',   width: 16 },
  ];
  styleHeader(cSheet.getRow(1));
  cSheet.views = [{ state: 'frozen', ySplit: 1 }];
  for (const [id, v] of Object.entries(catAgg).sort(([, a], [, b]) => b.total - a.total)) {
    const row = cSheet.addRow({
      cat:   catMap[id]?.name ?? 'Unknown',
      total: v.total,
      pct:   totalExp ? parseFloat(((v.total / totalExp) * 100).toFixed(1)) : 0,
      cnt:   v.count,
      avg:   parseFloat((v.total / v.count).toFixed(2)),
    });
    row.getCell('total').numFmt = CURRENCY_FMT;
    row.getCell('avg').numFmt   = CURRENCY_FMT;
    row.getCell('pct').numFmt   = '0.0"%"';
  }

  // ── Sheet 4: Dashboard ────────────────────────────────────────────────
  const month = currentMonth();
  const mTxs  = data.transactions.filter(t => t.date.startsWith(month));
  const mExp  = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const mInc  = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const dSheet = wb.addWorksheet('Dashboard');
  dSheet.columns = [{ header: '', key: 'k', width: 36 }, { header: '', key: 'v', width: 20 }];

  const addKpi = (label: string, value: string | number, valueFmt?: string, valueArgb?: string) => {
    const row = dSheet.addRow({ k: label, v: value });
    row.getCell('k').font = { bold: true, size: 11 };
    row.getCell('v').font = { bold: false, color: { argb: valueArgb ?? 'FF1F2328' } };
    if (valueFmt) row.getCell('v').numFmt = valueFmt;
    row.height = 20;
  };

  // Title
  const titleRow = dSheet.addRow({ k: 'Expense Tracker — Dashboard', v: '' });
  titleRow.getCell('k').font = { bold: true, size: 16, color: { argb: 'FF2563EB' } };
  titleRow.height = 30;
  dSheet.addRow({ k: 'Generated', v: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) });
  dSheet.addRow({});
  dSheet.addRow({ k: `— ${month} Summary —`, v: '' });
  addKpi('This Month Income',   mInc,  CURRENCY_FMT, 'FF16A34A');
  addKpi('This Month Expenses', mExp,  CURRENCY_FMT, 'FFDC2626');
  addKpi('Net Savings',         mInc - mExp, CURRENCY_FMT, mInc - mExp >= 0 ? 'FF2563EB' : 'FFEA580C');
  dSheet.addRow({});
  dSheet.addRow({ k: '— All-time —', v: '' });
  addKpi('Total Transactions',  data.transactions.length, undefined, 'FF1F2328');
  addKpi('All-time Expenses',   totalExp, CURRENCY_FMT, 'FFDC2626');
  dSheet.addRow({});
  dSheet.addRow({ k: '— Top 5 Categories This Month —', v: '' });
  const topCats: Record<string, number> = {};
  for (const t of mTxs.filter(x => x.type === 'expense')) {
    topCats[t.categoryId] = (topCats[t.categoryId] ?? 0) + t.amount;
  }
  Object.entries(topCats).sort(([, a], [, b]) => b - a).slice(0, 5)
    .forEach(([id, amt]) => addKpi(catMap[id]?.name ?? 'Unknown', amt, CURRENCY_FMT));

  // Write file
  const downloadsDir = path.join(os.homedir(), 'Downloads');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filePath = path.join(downloadsDir, `expenses-${dateStr}.xlsx`);
  await wb.xlsx.writeFile(filePath);

  return {
    success: true,
    filePath,
    message: `Excel file saved to ${filePath}`,
    sheets: ['Transactions', 'Monthly Summary', 'Category Breakdown', 'Dashboard'],
    transactionCount: data.transactions.length,
  };
}
