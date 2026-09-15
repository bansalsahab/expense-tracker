# 💸 Expense Tracker

A production-quality personal finance tracker — track expenses, set budgets, visualise spending, and export to Excel. Works as a PWA on iPhone and desktop.

**🌐 Live app → [expense-tracker-seven-xi-72.vercel.app](https://expense-tracker-seven-xi-72.vercel.app)**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://expense-tracker-seven-xi-72.vercel.app)
[![Built with Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## Features

| Feature | Details |
|---|---|
| 🔐 Auth | Email/password + Google OAuth via Supabase |
| ☁️ Cloud sync | One account, same data on every device |
| 📊 Dashboard | Totals, recent transactions, budget progress |
| 💳 Transactions | Add / edit / delete income & expenses |
| 🏷️ Categories | Custom categories with colour + emoji |
| 🎯 Budgets | Monthly per-category budgets with progress bars |
| 📈 Reports | Bar/pie charts, monthly breakdowns (Recharts) |
| 📤 Excel export | 4-sheet .xlsx download via ExcelJS |
| 📱 PWA | Installable on iPhone home screen, works offline |
| 🤖 MCP server | Claude Desktop / Cursor AI integration |

---

## Tech stack

- **Frontend** — React 19 + TypeScript + Vite + Tailwind CSS
- **Backend** — Supabase (PostgreSQL + Auth + Realtime)
- **Charts** — Recharts
- **Excel** — ExcelJS
- **Icons** — Lucide React
- **Deploy** — Vercel

---

## Getting started locally

### 1. Clone & install

```bash
git clone https://github.com/bansalsahab/expense-tracker.git
cd expense-tracker
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project (free tier).

### 3. Run the database migration

In your Supabase project → **SQL Editor** → paste and run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql).

### 4. Add environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploying to Vercel

```bash
vercel --prod
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel → **Settings → Environment Variables**, then redeploy.

---

## MCP server (AI assistant integration)

The `mcp-server/` directory contains a Model Context Protocol server that lets Claude Desktop or Cursor query and add expenses via natural language.

```bash
cd mcp-server
npm install
npm run build
```

See [`mcp-server/README.md`](mcp-server/README.md) for Claude Desktop and Cursor setup.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Oxlint (0 warnings enforced) |

---

## License

MIT
