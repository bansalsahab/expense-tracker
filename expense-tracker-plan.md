# Expense Tracker — MCP + PWA + Excel Plan

## Overview

Four parallel workstreams on the existing React/Vite/TypeScript expense tracker:

1. **MCP server** — standalone Node.js process in `mcp-server/` that reads/writes the shared data file and exposes tools to Claude Desktop / Cursor.
2. **Excel export** — `xlsx` (SheetJS) integration in the web app with a UI button on the Reports page; four styled sheets.
3. **PWA** — manifest, service worker, iOS meta tags, install prompt so the app is installable on iPhone.
4. **Mobile UI polish** — safe-area insets, minimum tap targets, no horizontal scroll.

### Key Constraint: Shared Data Source

The web app uses `localStorage`. The MCP server runs in Node.js and cannot access `localStorage`. Solution: add a thin **sync layer** — the web app also writes to a local JSON file (`~/.expense-tracker/data.json`) via a small Vite dev-proxy/API endpoint; the MCP server reads and writes the same file. In production (Vercel), the MCP server is run locally by the user, so the JSON file path is `~/.expense-tracker/data.json` on their machine. The web app, when running locally (`npm run dev`), syncs to the file via a tiny Express endpoint added to `vite.config.ts`. When deployed on Vercel the MCP server is always local so this is fine.

---

## Sub-Task 1 — MCP Server

**Status:** [ ] pending

**Intent:** Build a standalone MCP server (`mcp-server/`) that exposes 6 tools over stdio transport using `@modelcontextprotocol/sdk`. It reads/writes `~/.expense-tracker/data.json`. The web app gains a sync hook that writes to the same file on every mutation.

**Expected Outcomes:**
- `mcp-server/` directory with its own `package.json`, `tsconfig.json`, `src/index.ts`, `README.md`
- 6 tools implemented: `add_expense`, `get_expenses`, `delete_expense`, `get_summary`, `export_to_excel`, `get_dashboard_stats`
- Web app writes to `~/.expense-tracker/data.json` on every `saveData()` call (Node-only, guarded so browser build is unaffected)
- `mcp-server/README.md` shows claude_desktop_config.json snippet and Cursor setup
- `mcp-server/` has its own build: `npm run build` → `dist/index.js`

**Todo List:**
1. Create `mcp-server/package.json` with `@modelcontextprotocol/sdk`, `xlsx`, `uuid`, `zod` dependencies
2. Create `mcp-server/tsconfig.json` (CommonJS target, strict, Node16 module resolution)
3. Create `mcp-server/src/data.ts` — reads/writes `~/.expense-tracker/data.json`, seeds defaults if missing
4. Create `mcp-server/src/tools.ts` — implements all 6 tool handlers using data.ts
5. Create `mcp-server/src/index.ts` — MCP server entry point, registers all tools with JSON Schema
6. Create `mcp-server/README.md` — setup instructions for Claude Desktop and Cursor
7. Modify `src/store.ts` in the web app — after `localStorage.setItem`, also POST to `/api/sync` when `window.__MCP_SYNC__` flag is set (feature-flagged, no-op in production)
8. Add `/api/sync` endpoint in `vite.config.ts` dev server plugin that writes to `~/.expense-tracker/data.json`

**Relevant Context:**
- `src/store.ts` `saveData()` is the single write point — add sync there
- `src/types.ts` — `AppData`, `Transaction`, `Category`, `Budget` interfaces must be duplicated/imported in mcp-server (copy types, don't create a shared package to keep it simple)
- MCP SDK: `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`, `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`

---

## Sub-Task 2 — Excel Export

**Status:** [ ] pending

**Intent:** Add a one-click Excel export button to the Reports page that generates a well-formatted `.xlsx` with 4 sheets.

**Expected Outcomes:**
- `npm install xlsx` added to web app dependencies
- New `src/utils/exportExcel.ts` with `exportToExcel(data: AppData, categories: Category[])` function
- Reports page has an "Export to Excel" button (top-right, `btn-primary` style with Download icon)
- Generated file has sheets: Transactions, Monthly Summary, Category Breakdown, Dashboard
- Currency cells formatted as `$#,##0.00`, date cells as `DD-MMM-YYYY`
- Columns auto-width, header row bold
- MCP `export_to_excel` tool calls the same logic (in `mcp-server/src/tools.ts`) and saves file to `~/Downloads/expenses.xlsx`, returns path

**Todo List:**
1. `npm install xlsx` in web app root
2. Create `src/utils/exportExcel.ts` — pure function, takes `AppData` + category map, returns and triggers download
3. Transactions sheet: Date, Description, Category, Amount, Payment Method (hardcoded "N/A" since field doesn't exist yet), Notes — auto-width, bold headers, table style
4. Monthly Summary sheet: aggregated by `YYYY-MM`
5. Category Breakdown sheet: per-category totals with % of total
6. Dashboard sheet: KPI summary with colored cells
7. Add Export button to `src/pages/Reports.tsx` top-right area
8. MCP `export_to_excel` handler in `mcp-server/src/tools.ts` — same sheet logic using Node.js `xlsx`, saves to `~/Downloads/expenses-<date>.xlsx`

**Relevant Context:**
- `src/types.ts` — `Transaction` has no `paymentMethod` field; column will show "—" placeholder
- Existing Reports page has year-nav card at max-w-xs — export button goes in the same header row
- `formatCurrency` from `src/store.ts` is browser-only (Intl); Excel numeric values should be raw numbers with cell format string applied

---

## Sub-Task 3 — PWA / iOS

**Status:** [ ] pending

**Intent:** Make the app installable on iPhone via Safari "Add to Home Screen" with full offline support.

**Expected Outcomes:**
- `public/manifest.json` with all required fields
- `public/sw.js` service worker caching app shell
- `index.html` has Apple meta tags + splash screen links
- `public/icons/` contains PNG icons at 180, 192, 512 sizes (generated programmatically with Canvas API at build time, or shipped as static PNGs)
- `src/components/InstallBanner.tsx` shows iOS install instructions when in Safari and not in standalone mode
- Service worker registered in `src/main.tsx`
- Vite config updated to copy `sw.js` and `manifest.json` to dist root

**Todo List:**
1. Generate placeholder PNG icons (solid blue `#2563eb` with white `$` text) using a Node script `scripts/gen-icons.js` — outputs to `public/icons/icon-180.png`, `icon-192.png`, `icon-512.png`
2. Create `public/manifest.json` — name, short_name, display: standalone, theme_color: #2563eb, background_color: #f8fafc, start_url: /, icons array
3. Add Apple meta tags to `index.html` — `apple-mobile-web-app-capable`, status bar style, touch icon links, splash screens
4. Create `public/sw.js` — cache-first strategy for app shell (HTML, CSS, JS assets)
5. Register service worker in `src/main.tsx`
6. Create `src/components/InstallBanner.tsx` — detects iOS Safari + not standalone, shows bottom sheet with "Tap Share → Add to Home Screen" instructions
7. Add `<InstallBanner />` to `src/Layout.tsx`
8. Add `safe-area` padding to `src/index.css` body and bottom nav

**Relevant Context:**
- `vite.config.ts` is minimal — no custom publicDir needed (default `public/` is already served)
- `src/Layout.tsx` wraps everything — good place for install banner
- iOS Safari detection: `navigator.userAgent` includes "iPhone" or "iPad" and not "CriOS" or "FxiOS"

---

## Sub-Task 4 — Mobile UI Polish

**Status:** [ ] pending

**Intent:** Ensure all pages work perfectly on iPhone — no horizontal scroll, touch-friendly tap targets, proper insets.

**Expected Outcomes:**
- All interactive elements are at least 44×44pt
- No horizontal overflow on any page
- Bottom safe area inset on Layout main content area
- Sidebar overlay covers full screen on mobile
- Transaction list items have sufficient touch targets

**Todo List:**
1. Add `pb-safe` / `env(safe-area-inset-bottom)` CSS to `src/index.css`
2. Audit `src/pages/*.tsx` for any fixed-width containers that could overflow on 375px screens
3. Ensure `.btn-*` classes have `min-h-[44px]` and touch action is correct
4. Verify filter dropdowns in Expenses.tsx wrap properly on small screens (already uses `flex-wrap`, confirm)
5. Fix `src/components/Sidebar.tsx` overlay to cover viewport including safe areas

**Relevant Context:**
- Current Layout: `h-screen overflow-hidden` on outer div — safe area needs to be applied inside main
- Current sidebar already has `fixed inset-0` overlay

---

## Sub-Task 5 — Finalize, Commit, Push, Deploy

**Status:** [ ] pending

**Intent:** Update documentation, commit all changes, push to GitHub, redeploy Vercel.

**Expected Outcomes:**
- `AGENTS.md` updated with MCP setup, new scripts, PWA notes, Excel export notes
- `mcp-server/` has its own `npm install` step noted
- Single git commit with full description
- Pushed to `https://github.com/bansalsahab/expense-tracker`
- `npx vercel --prod` re-deploys live site

**Todo List:**
1. Update root `AGENTS.md` with MCP section, PWA build notes, Excel export utility location
2. Update `.bob/rules-*/AGENTS.md` with relevant non-obvious patterns
3. `git add -A && git commit -m "..."` with multi-line message covering all 4 parts
4. `git push origin main`
5. `npx vercel --prod --yes` to redeploy

---

## Files Created / Modified

### Created
- `mcp-server/package.json`
- `mcp-server/tsconfig.json`
- `mcp-server/src/index.ts`
- `mcp-server/src/data.ts`
- `mcp-server/src/tools.ts`
- `mcp-server/src/types.ts`
- `mcp-server/README.md`
- `scripts/gen-icons.mjs`
- `public/manifest.json`
- `public/sw.js`
- `public/icons/icon-180.png`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `src/utils/exportExcel.ts`
- `src/components/InstallBanner.tsx`

### Modified
- `src/store.ts` — add file sync hook
- `src/pages/Reports.tsx` — add export button
- `src/main.tsx` — register service worker
- `src/Layout.tsx` — add InstallBanner
- `src/index.css` — safe-area insets, tap target sizes
- `vite.config.ts` — add sync API endpoint for dev
- `index.html` — Apple PWA meta tags, manifest link
- `AGENTS.md`
- `.bob/rules-agent/AGENTS.md`
- `.bob/rules-plan/AGENTS.md`
