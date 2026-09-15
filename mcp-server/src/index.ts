// @ts-nocheck
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  handleAddExpense,
  handleGetExpenses,
  handleDeleteExpense,
  handleGetSummary,
  handleGetDashboardStats,
  handleExportToExcel,
} from './tools';

const server = new McpServer({ name: 'expense-tracker', version: '1.0.0' });

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] });
const ok   = (d: unknown) => text(JSON.stringify(d, null, 2));
const fail = (e: unknown) => ({ ...text(`Error: ${(e as Error)?.message ?? e}`), isError: true as const });

server.tool('add_expense', 'Add a new expense or income transaction.', {
  amount:        z.number().positive(),
  description:   z.string().min(1),
  category:      z.string(),
  date:          z.string().optional(),
  type:          z.string().optional(),
  paymentMethod: z.string().optional(),
  notes:         z.string().optional(),
}, async (args: Record<string, unknown>) => {
  try { return ok(handleAddExpense(args)); } catch (e) { return fail(e); }
});

server.tool('get_expenses', 'Retrieve transactions with optional filters.', {
  dateFrom:      z.string().optional(),
  dateTo:        z.string().optional(),
  category:      z.string().optional(),
  type:          z.string().optional(),
  paymentMethod: z.string().optional(),
}, async (args: Record<string, unknown>) => {
  try { return ok(handleGetExpenses(args)); } catch (e) { return fail(e); }
});

server.tool('delete_expense', 'Delete a transaction by ID.', {
  id: z.string().min(1),
}, async (args: Record<string, unknown>) => {
  try { return ok(handleDeleteExpense(args)); } catch (e) { return fail(e); }
});

server.tool('get_summary', 'Spending summary, category breakdown, monthly trends.', {
  month: z.string().optional(),
}, async (args: Record<string, unknown>) => {
  try { return ok(handleGetSummary(args)); } catch (e) { return fail(e); }
});

server.tool('get_dashboard_stats', 'All dashboard KPIs: income, expenses, savings, top category, recent transactions.',
  async () => { try { return ok(handleGetDashboardStats({})); } catch (e) { return fail(e); } }
);

server.tool('export_to_excel', 'Export all data to ~/Downloads/expenses-<date>.xlsx and return the file path.',
  async () => { try { return ok(await handleExportToExcel({})); } catch (e) { return fail(e); } }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('Expense Tracker MCP server running on stdio\n');
}
main().catch(e => { process.stderr.write(`Fatal: ${e}\n`); process.exit(1); });
