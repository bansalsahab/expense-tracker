# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Documentation Context

- All persistent data is in a single `localStorage` key `"expense-tracker-data"` — no backend, no API.
- `src/store.ts` is the authoritative reference for data shape and default categories (14 defaults seeded on first load).
- `src/types.ts` defines all shared types — `Transaction.date` is `YYYY-MM-DD` string, `Budget.month` is `YYYY-MM` string.
- `vercel.json` is the only deployment config — it does a catch-all rewrite for SPA routing.
- No test files exist anywhere in the project.
