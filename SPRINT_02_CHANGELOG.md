# PersonalHub — Sprint 02 Changelog
**Date:** 2026-02-17

## Scope closed
- A-01..A-04: `member_permissions` (schema + RLS + seed/trigger), server actions прав, UI управления правами в `/dashboard/family`.
- B-01..B-03: календарь MVP (`events`, `event_visibility`, actions, month-view UI, CRUD).
- C-01..C-02: permission-gates в layout/nav/pages + read-only режимы + helper `lib/permissions.ts`.
- D-01..D-02: визуальный polish `auth` и консистентность dashboard/empty states.
- E-01..E-02: Playwright e2e scaffolding + release smoke script.

## Database migrations (Sprint 02)
- `20260218090000_member_permissions.sql`
- `20260218093000_member_permissions_seed.sql`
- `20260218103000_calendar.sql`

## Validation
- `npm run check-types -w web` — passed.
- `npm run lint -w web` — passed.
- `npx supabase migration list` — `local == remote`.
- `node scripts/smoke/sprint02-smoke.mjs` — passed with successful JSON report:
  - `memberPermissionsSeed=true`
  - `calendarCrud=true`
  - `tasksSanity=true`
  - `shoppingSanity=true`
  - `notesSanity=true`
  - `rlsIsolation=true`

## Known follow-up
- E2E тесты добавлены, но финальный пункт DoD "E2E проходят" требует отдельного стабильного тестового стенда/учёток и прогона в CI.
