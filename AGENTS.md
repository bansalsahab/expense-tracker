# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands

```bash
npm run dev        # dev server
npm run build      # tsc -b && vite build  (type-check + bundle)
npm run lint       # oxlint (NOT eslint)
npm run preview    # preview production build
```

No test runner is configured — there are no tests.

## Critical TypeScript Rules

**`verbatimModuleSyntax` is enabled** — all type-only imports MUST use `import type`:
```ts
import type { Transaction, Category } from './types';        // ✅
import { type ReactNode } from 'react';                      // ✅
import { Transaction } from './types';                       // ❌ build error
```
`noUnusedLocals` and `noUnusedParameters` are errors — remove unused imports immediately or the build fails.

## State / Data Flow

All app state lives in a single `AppData` object (`src/context.tsx`) backed by `localStorage` key `"expense-tracker-data"`.

- **Never write to localStorage directly** — all mutations go through the pure functions in `src/store.ts` which write and return an updated `AppData`.
- Every store function signature: `(data: AppData, payload) => AppData` — they are pure and always call `saveData()` before returning.
- Pages/components consume state exclusively via `useApp()` from `src/context.tsx`. Never import from `src/store.ts` in UI files (store has no React).

## Date / Budget Conventions

- `Transaction.date` is always `YYYY-MM-DD` (string, no `Date` object stored).
- `Budget.month` is always `YYYY-MM`.
- Use `date-fns` for all date formatting/arithmetic — do not use `new Date()` arithmetic directly.
- When constructing a `Date` from a stored date string, always append `T00:00:00` to avoid UTC-offset shifts: `new Date(tx.date + 'T00:00:00')`.

## Recharts Tooltip Formatter

Recharts `Formatter` generic is strict — cast to `any` to avoid `NameType` mismatch:
```tsx
formatter={((v: unknown, name: unknown) => [...]) as any}
```

## Routing

`vercel.json` rewrites all routes to `/index.html` for SPA support. If adding new top-level routes, no changes needed — rewrites are catch-all.

## Styling

Tailwind v3 with custom component classes in `src/index.css`: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.badge`. Use these before writing inline Tailwind chains.
