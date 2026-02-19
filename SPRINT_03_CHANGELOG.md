# PersonalHub — Sprint 03 Changelog
**Date:** 2026-02-18

## Scope closed
- A-01..A-03: финансы MVP в БД (`finance_categories`, `accounts`, `transactions`) + RLS + seed + валидации consistency.
- B-01..B-02: server actions и UI для `/dashboard/finances` (summary, счета, фильтры, create/delete транзакций).
- C-01..C-03: вишлисты MVP (`wishlists`, `wishlist_items`) + actions + UI (создание списков/items, reserve/unreserve).
- D-01: интеграция permissions gates для `finances` и `wishlists` (layout/nav/page/read-only).
- E-01..E-02: стабилизация e2e (smoke/full split + новые spec) и CI workflow для web quality.

## Database migrations (Sprint 03)
- `20260219090000_finance_categories.sql`
- `20260219093000_accounts.sql`
- `20260219100000_transactions.sql`
- `20260219113000_wishlists.sql`

## Validation
- `npm run check-types -w web` — passed.
- `npm run lint -w web` — passed.
- `npx supabase migration list` — `local == remote`.
- `npm run e2e:smoke -w web` — executed:
  - passed: auth smoke
  - skipped: smoke tests requiring `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`

## CI
- Added workflow: `personalhub/.github/workflows/web-quality.yml`.
- Jobs:
  - `install`
  - `check-types -w web`
  - `lint -w web`
  - `node scripts/smoke/sprint02-smoke.mjs`
  - `npm run e2e -w web -- e2e/auth.spec.ts`
- Required secrets are explicitly verified in workflow steps.

## Known follow-up
- Добавить детерминированный e2e seed для full-flow сценариев `finances` и `wishlists` с несколькими ролями.
- Расширить финансовый модуль до переводов между счетами и целей накоплений (Sprint 04+).
