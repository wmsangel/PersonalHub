# PersonalHub — Sprint 02 Tasks
> **Для:** Cursor/Codex AI Agent  
> **Контекст:** Перед началом читать `ARCHITECTURE.md`  
> **Цель спринта:** Ролевой доступ к модулям + календарь MVP + стабилизация качества (e2e/smoke)
> **Проверка после каждой задачи:** `npm run check-types -w web` + `npm run lint -w web`

---

## 🔐 БЛОК A — Permission System (member_permissions)

### A-01 · Миграция `member_permissions` + RLS

**Файл:** `personalhub/supabase/migrations/20260218090000_member_permissions.sql`

**Что сделать:**
- Создать таблицу `member_permissions` (по архитектуре, section 5.4).
- Добавить индексы: `(family_id)`, `(member_id)`, `(module)`.
- Включить RLS.
- Политики:
  - `SELECT`: член семьи видит permissions своей семьи.
  - `INSERT/UPDATE/DELETE`: только `is_family_admin(family_id)`.
- Добавить уникальный ключ `UNIQUE (member_id, module)`.

**После:** `npx supabase db push`

---

### A-02 · Seed default permissions для новых и текущих участников

**Файл:** `personalhub/supabase/migrations/20260218093000_member_permissions_seed.sql`

**Что сделать:**
- Заполнить `member_permissions` для уже существующих `family_members`.
- Правила по умолчанию:
  - `admin`: полный доступ ко всем модулям.
  - `adult`: `can_view=true`, `can_edit=true` для `tasks`, `shopping`, `notes`, `calendar`; остальное `can_view=false`.
  - `child`/`guest`: `tasks`, `shopping` (view/edit=true), остальное `false`.
- Добавить SQL-функцию/триггер для авто-создания permissions при добавлении `family_members`.

---

### A-03 · API/Actions для управления правами

**Файлы:**
- `personalhub/apps/web/lib/actions/permissions.ts`
- `personalhub/apps/web/lib/actions/family.ts` (если уже есть семейные actions)

**Реализовать:**
- `getMemberPermissionsAction(memberId: string)`
- `updateMemberPermissionAction(memberId: string, module: ModuleName, payload: { can_view: boolean; can_edit: boolean })`
- `bulkResetPermissionsAction(memberId: string, role: FamilyRole)`

**Важно:**
- Проверка сессии.
- Только admin имеет доступ к mutating actions.
- После update: `revalidatePath('/dashboard/family')`.

---

### A-04 · UI управления доступом на странице семьи

**Файл:** `personalhub/apps/web/app/dashboard/family/page.tsx`

**Компоненты:**
- `personalhub/apps/web/components/family/PermissionsDialog.tsx`
- `personalhub/apps/web/components/family/PermissionRow.tsx`

**Что реализовать:**
- Кнопка `Права` у каждого участника (видна только admin).
- Диалог с таблицей модулей (`tasks`, `shopping`, `notes`, `calendar`, `finances`, `wishlists`, `documents`).
- Переключатели `View` / `Edit` с валидацией (`Edit` невозможен, если `View=false`).
- Кнопка `Сбросить по роли`.

---

## 📅 БЛОК B — Календарь MVP

### B-01 · Миграция БД: `events` + `event_visibility`

**Файл:** `personalhub/supabase/migrations/20260218103000_calendar.sql`

**Таблицы:**
- `events`:
  - `id`, `family_id`, `created_by`, `title`, `description`, `starts_at`, `ends_at`, `is_all_day`, `location`, `created_at`, `updated_at`
- `event_visibility`:
  - `id`, `event_id`, `member_id`, `can_view`, `can_edit`

**Требования:**
- FK и каскады.
- trigger `update_updated_at()` для `events.updated_at`.
- RLS:
  - базовый доступ через `is_family_member(family_id)`;
  - опционально ограничение через `event_visibility`.

**После:** `npx supabase db push`

---

### B-02 · Actions для календаря

**Файл:** `personalhub/apps/web/lib/actions/calendar.ts`

**Реализовать:**
- `getEventsAction(params: { from: string; to: string })`
- `createEventAction(data: EventInput)`
- `updateEventAction(eventId: string, data: Partial<EventInput>)`
- `deleteEventAction(eventId: string)`

**Условия:**
- RLS + явная проверка auth.
- `starts_at < ends_at` (кроме all-day кейса).

---

### B-03 · UI страницы `/dashboard/calendar`

**Файл:** `personalhub/apps/web/app/dashboard/calendar/page.tsx`

**Компоненты:**
- `personalhub/apps/web/components/calendar/CalendarHeader.tsx`
- `personalhub/apps/web/components/calendar/CalendarDayGrid.tsx`
- `personalhub/apps/web/components/calendar/EventDialog.tsx`

**Что сделать (MVP):**
- Month view (7x6 grid).
- Переход месяц назад/вперёд.
- Отображение событий внутри дня (до 3 шт + `+N`).
- CRUD через dialog.
- Пустое состояние.

---

## 🛡️ БЛОК C — Access Enforcement в UI/Routes

### C-01 · Gate по permissions в layout/dashboard-модулях

**Файлы:**
- `personalhub/apps/web/app/dashboard/layout.tsx`
- `personalhub/apps/web/components/layout/nav-items.ts`
- страницы модулей (`tasks`, `shopping`, `notes`, `calendar`)

**Что сделать:**
- Скрывать модули в sidebar/mobile nav, если `can_view=false`.
- На уровне page защищать доступ: если модуля нет в правах → `notFound()` или redirect на `/dashboard`.
- Для read-only участников блокировать actions UI (кнопки create/edit/delete disabled + тултип).

---

### C-02 · Единый helper `canAccessModule`

**Файл:** `personalhub/apps/web/lib/permissions.ts`

**Реализовать:**
- `canViewModule(permissions, module)`
- `canEditModule(permissions, module)`
- `assertCanViewModule(...)`
- `assertCanEditModule(...)`

---

## 🎨 БЛОК D — UI Polish (auth + dashboard)

### D-01 · Финальная чистка auth UI

**Файл:** `personalhub/apps/web/app/auth/page.tsx`

**Что сделать:**
- Привести композицию к финальному MVP-виду: стабильные пропорции 1440/1280/1024/768/390.
- Убрать визуальный шум, повысить контраст текста и инпутов.
- Единые spacing/token правила.

---

### D-02 · Улучшить dashboard visual consistency

**Файлы:** `layout`, виджеты, карточки модулей

**Что сделать:**
- Единый стиль карточек, заголовков, бейджей, пустых состояний.
- Уменьшить различия между модулями по отступам/размерам controls.
- Добавить 1-2 аккуратных motion-эффекта появления блоков.

---

## 🧪 БЛОК E — Тестирование и качество

### E-01 · E2E сценарии (Playwright)

**Файлы:**
- `personalhub/apps/web/e2e/auth.spec.ts`
- `personalhub/apps/web/e2e/tasks.spec.ts`
- `personalhub/apps/web/e2e/shopping.spec.ts`
- `personalhub/apps/web/e2e/notes.spec.ts`
- `personalhub/apps/web/e2e/permissions.spec.ts`

**Минимум сценариев:**
- auth flow (sign up/sign in/sign out),
- tasks CRUD,
- shopping CRUD,
- notes CRUD,
- permission gate (скрытие модуля + запрет edit).

---

### E-02 · Smoke script для релиза

**Файл:** `personalhub/scripts/smoke/sprint02-smoke.mjs`

**Что сделать:**
- Автоматизированный smoke с setup/teardown тестовой семьи:
  - member_permissions seed,
  - calendar CRUD,
  - tasks/shopping/notes sanity,
  - валидация ключевых RLS-ограничений.
- Выводить итог JSON-отчёт + exit code.

---

## 📋 Порядок выполнения

```text
A-01 → A-02 → A-03 → A-04
    ↓
B-01 → B-02 → B-03
    ↓
C-01 → C-02
    ↓
D-01 → D-02
    ↓
E-01 → E-02
```

---

## ✅ Definition of Done для Sprint 02

- [x] `npm run check-types -w web` — 0 ошибок
- [x] `npm run lint -w web` — 0 ошибок
- [x] `npx supabase migration list` — local == remote
- [x] `member_permissions` работает для всех ролей (`admin/adult/child/guest`)
- [x] UI семьи позволяет менять права модулей участника
- [x] Календарь MVP: создать/редактировать/удалить событие
- [x] Доступ к модулям реально ограничивается и в UI, и в server actions
- [x] Auth и Dashboard визуально доведены до консистентного состояния
- [ ] E2E тесты для критичных сценариев проходят
- [x] Smoke script Sprint 02 выдаёт успешный отчёт

### Примечание по E2E (2026-02-17)
- Playwright-конфиг и ключевые спецификации добавлены (`auth/tasks/shopping/notes/permissions`).
- Для полного прогона нужны стабильные тестовые учётки и/или isolated тестовое окружение (`E2E_USER_EMAIL`, `E2E_USER_PASSWORD`).
- Часть сценариев уже автоматизирована, но пункт DoD "проходят" оставлен открытым до финального CI/локального e2e-run с выделенным тестовым стендом.

---

*После завершения Sprint 02 обновить `ARCHITECTURE.md` и создать `SPRINT_02_CHANGELOG.md`.*
