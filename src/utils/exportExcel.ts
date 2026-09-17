import ExcelJS from 'exceljs';
import type { AppData, Category } from '../types';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true, color: { argb: 'FFFFFFFF' }, size: 11,
};
const CURRENCY_FMT = '"₹"#,##0.00';
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

export async function exportToExcel(data: AppData): Promise<void> {
  const catMap = Object.fromEntries(data.categories.map((c: Category) => [c.id, c]));
  const totalExp = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Expense Tracker';
  wb.created = new Date();

  // ── Sheet 1: Transactions ─────────────────────────────────────────────────
  const txSheet = wb.addWorksheet('Transactions');
  txSheet.columns = [
    { header: 'Date',           key: 'date',   width: 14 },
    { header: 'Description',    key: 'desc',   width: 34 },
    { header: 'Category',       key: 'cat',    width: 22 },
    { header: 'Type',           key: 'type',   width: 10 },
    { header: 'Amount',         key: 'amount', width: 14 },
    { header: 'Payment Method', key: 'pm',     width: 18 },
    { header: 'Notes',          key: 'notes',  width: 30 },
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
      pm:     '—',
      notes:  t.notes ?? '',
    });
    row.getCell('date').numFmt   = DATE_FMT;
    row.getCell('amount').numFmt = CURRENCY_FMT;
    row.getCell('amount').font   = {
      color: { argb: t.type === 'expense' ? 'FFDC2626' : 'FF16A34A' },
    };
  }

  // ── Sheet 2: Monthly Summary ──────────────────────────────────────────────
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
    { header: 'Month',               key: 'month',  width: 12 },
    { header: 'Total Expenses',      key: 'exp',    width: 16 },
    { header: 'Total Income',        key: 'inc',    width: 14 },
    { header: 'Net Savings',         key: 'sav',    width: 14 },
    { header: 'Transactions',        key: 'cnt',    width: 14 },
    { header: 'Avg per Transaction', key: 'avg',    width: 20 },
    { header: 'Top Category',        key: 'topcat', width: 22 },
  ];
  styleHeader(mSheet.getRow(1));
  mSheet.views = [{ state: 'frozen', ySplit: 1 }];
  for (const [month, v] of Object.entries(monthMap).sort(([a], [b]) => b.localeCompare(a))) {
    const topCatId = Object.entries(v.cats).sort((a, b) => b[1] - a[1])[0]?.[0];
    const row = mSheet.addRow({
      month,
      exp:    v.expenses,
      inc:    v.income,
      sav:    v.income - v.expenses,
      cnt:    v.count,
      avg:    v.count ? v.expenses / v.count : 0,
      topcat: topCatId ? (catMap[topCatId]?.name ?? '—') : '—',
    });
    (['exp', 'inc', 'sav', 'avg'] as const).forEach(k => {
      row.getCell(k).numFmt = CURRENCY_FMT;
    });
  }

  // ── Sheet 3: Category Breakdown ───────────────────────────────────────────
  const catAgg: Record<string, { total: number; count: number }> = {};
  for (const t of data.transactions.filter(x => x.type === 'expense')) {
    if (!catAgg[t.categoryId]) catAgg[t.categoryId] = { total: 0, count: 0 };
    catAgg[t.categoryId].total += t.amount;
    catAgg[t.categoryId].count++;
  }
  const cSheet = wb.addWorksheet('Category Breakdown');
  cSheet.columns = [
    { header: 'Category',       key: 'cat',   width: 22 },
    { header: 'Total Amount',   key: 'total', width: 16 },
    { header: '% of Total',     key: 'pct',   width: 12 },
    { header: 'Transactions',   key: 'cnt',   width: 14 },
    { header: 'Average Amount', key: 'avg',   width: 16 },
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

  // ── Sheet 4: Dashboard ─────────────────────────────────────────────────────
  const month = new Date().toISOString().slice(0, 7);
  const mTxs  = data.transactions.filter(t => t.date.startsWith(month));
  const mExp  = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const mInc  = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const dSheet = wb.addWorksheet('Dashboard');
  dSheet.columns = [{ header: '', key: 'k', width: 36 }, { header: '', key: 'v', width: 20 }];

  const addKpi = (label: string, value: string | number, fmt?: string, argb?: string) => {
    const row = dSheet.addRow({ k: label, v: value });
    row.getCell('k').font = { bold: true, size: 11 };
    row.getCell('v').font = { color: { argb: argb ?? 'FF1F2328' } };
    if (fmt) row.getCell('v').numFmt = fmt;
    row.height = 20;
  };

  const titleRow = dSheet.addRow({ k: 'Expense Tracker — Dashboard', v: '' });
  titleRow.getCell('k').font = { bold: true, size: 16, color: { argb: 'FF2563EB' } };
  titleRow.height = 32;
  dSheet.addRow({ k: 'Generated', v: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) });
  dSheet.addRow({});
  dSheet.addRow({ k: `— ${month} Summary —`, v: '' });
  addKpi('This Month Income',   mInc,               CURRENCY_FMT, 'FF16A34A');
  addKpi('This Month Expenses', mExp,               CURRENCY_FMT, 'FFDC2626');
  addKpi('Net Savings',         mInc - mExp,        CURRENCY_FMT, mInc - mExp >= 0 ? 'FF2563EB' : 'FFEA580C');
  dSheet.addRow({});
  dSheet.addRow({ k: '— All-time —', v: '' });
  addKpi('Total Transactions', data.transactions.length);
  addKpi('All-time Expenses',  totalExp, CURRENCY_FMT, 'FFDC2626');
  dSheet.addRow({});
  dSheet.addRow({ k: '— Top 5 Categories This Month —', v: '' });
  const topCats: Record<string, number> = {};
  for (const t of mTxs.filter(x => x.type === 'expense')) {
    topCats[t.categoryId] = (topCats[t.categoryId] ?? 0) + t.amount;
  }
  Object.entries(topCats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([id, amt]) => addKpi(catMap[id]?.name ?? 'Unknown', amt, CURRENCY_FMT));

  // ── Download in browser ────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href     = url;
  link.download = `expenses-${date}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
