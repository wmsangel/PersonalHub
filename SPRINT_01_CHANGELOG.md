# PersonalHub — Sprint 01 Changelog
**Date:** 2026-02-17

## Scope closed
- A-01..A-04: design system, theme tokens, dashboard layout, dashboard widgets.
- F-01..F-03: Supabase DB types, `useFamily` context/provider, toast notifications.
- B-01..B-03: tasks migration + actions + UI.
- C-01..C-02: shopping migration + actions + UI + realtime hook.
- D-01..D-02: notes migration + actions + UI/editor.
- E-01: family management moved to `/dashboard/family`.

## Database
- Applied migrations are synchronized (`local == remote`):
  - `20260217000000_initial_family_schema.sql`
  - `20260217132000_family_core_rls.sql`
  - `20260217143000_family_invites.sql`
  - `20260217200000_tasks.sql`
  - `20260217210000_shopping.sql`
  - `20260217220000_notes.sql`
  - `20260217223000_shopping_realtime.sql`

## Smoke-test summary
- `npm run check-types -w web` passed.
- `npm run lint -w web` passed.
- CRUD automated smoke passed for:
  - `tasks`
  - `shopping_lists` / `shopping_items`
  - `notes`
- Realtime setup migration added for `shopping_items`.
- Final realtime UX validation should be done in browser with 2 tabs on `/dashboard/shopping`.
