# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Architecture Constraints

- **Single state atom**: `AppData` = `{ transactions[], categories[], budgets[] }` — all pages read from this one object via `useApp()`.
- **Store is pure**: every `src/store.ts` function takes `AppData` and returns a new `AppData` (writes to localStorage as a side effect). New data operations must follow this pattern.
- **Context is the only bridge**: `src/context.tsx` is the only file that imports from `src/store.ts` — pages import only from `src/context.tsx`.
- **No router data loading**: all filtering/aggregation is done in-component with `useMemo` — there are no loaders or server-side concerns.
- **Budget upsert logic**: `upsertBudget` in store matches on `(categoryId, month)` pair — adding a budget for the same category+month updates rather than inserts. New budget features must preserve this.
- **Default categories are generated with `uuidv4()` at module load** in `src/store.ts` — IDs are stable per session but regenerated on fresh installs. Don't rely on hardcoded category IDs.
