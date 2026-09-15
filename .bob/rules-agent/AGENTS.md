# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Coding Rules

- `verbatimModuleSyntax` enforced — every type import needs `import type` or build fails.
- `noUnusedLocals`/`noUnusedParameters` are errors — remove unused imports before committing.
- All state mutations go through `src/store.ts` pure functions only; never call `localStorage` directly.
- `useApp()` is the only way to access/mutate state in components — do not import store functions in UI files.
- Append `T00:00:00` when constructing `Date` from stored `YYYY-MM-DD` strings to prevent UTC offset bugs.
- Recharts `Tooltip` formatter must be cast `as any` — the `NameType` generic causes build errors otherwise.
- Reuse Tailwind component classes from `src/index.css` (`.card`, `.btn-primary`, `.input`, etc.) instead of repeating utility chains.
- No test runner exists — `npm run lint` (oxlint, not eslint) is the only automated check beyond `npm run build`.
