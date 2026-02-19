# PersonalHub — Sprint 03 Tasks
> **Для:** Cursor/Codex AI Agent  
> **Контекст:** Перед началом каждой задачи читать `ARCHITECTURE.md`  
> **Цель спринта:** Финансы MVP + Вишлисты MVP + стабильный e2e/CI контур  
> **Проверка после каждой задачи:** `npm run check-types -w web` + `npm run lint -w web`

---

## 💰 БЛОК A — Финансы MVP (БД)

### A-01 · Миграция `finance_categories` + seed
**Файл:** `personalhub/supabase/migrations/20260219090000_finance_categories.sql`

**Что сделать:**
- Таблица `finance_categories`:
  - `id`, `family_id`, `name`, `kind` (`income|expense`), `color`, `icon`, `is_system`, `created_at`
- Индексы: `(family_id, kind)`, `(family_id, name)`
- Seed системных категорий (доходы/расходы) для каждой семьи.
- RLS: `SELECT` для членов семьи, mutate только admin.

---

### A-02 · Миграция `accounts`
**Файл:** `personalhub/supabase/migrations/20260219093000_accounts.sql`

**Что сделать:**
- Таблица `accounts`:
  - `id`, `family_id`, `name`, `type` (`cash|card|deposit|savings`), `currency`, `balance`, `is_archived`, `created_at`, `updated_at`
- Trigger `update_updated_at()`.
- RLS: `SELECT` для членов семьи, mutate только users с `can_edit finances`.

---

### A-03 · Миграция `transactions`
**Файл:** `personalhub/supabase/migrations/20260219100000_transactions.sql`

**Что сделать:**
- Таблица `transactions`:
  - `id`, `family_id`, `account_id`, `category_id`, `created_by`, `amount`, `kind`, `title`, `note`, `transaction_date`, `created_at`, `updated_at`
- Валидации:
  - `amount > 0`
  - `kind` соответствует категории (`income|expense`)
- RLS: `SELECT` по семье, mutate через права на модуль `finances`.

---

## 📊 БЛОК B — Финансы MVP (Actions + UI)

### B-01 · Actions для финансов
**Файл:** `personalhub/apps/web/lib/actions/finances.ts`

**Реализовать:**
- `getAccountsAction()`
- `createAccountAction(data)`
- `updateAccountAction(id, data)`
- `getTransactionsAction(params)`
- `createTransactionAction(data)`
- `deleteTransactionAction(id)`
- `getFinanceSummaryAction({ month })`

**Важно:**
- Проверка сессии.
- Проверка `can_view` / `can_edit` для `finances`.
- `revalidatePath('/dashboard/finances')`.

---

### B-02 · Страница `/dashboard/finances`
**Файл:** `personalhub/apps/web/app/dashboard/finances/page.tsx`

**Компоненты:**
- `personalhub/apps/web/components/finances/AccountsPanel.tsx`
- `personalhub/apps/web/components/finances/TransactionList.tsx`
- `personalhub/apps/web/components/finances/TransactionDialog.tsx`
- `personalhub/apps/web/components/finances/SummaryCards.tsx`

**Что реализовать:**
- Summary cards: доход / расход / баланс месяца.
- Список счетов + остатки.
- Список транзакций с фильтрами (период, категория, тип).
- CRUD транзакций (минимум create/delete).
- Пустое состояние.

---

## 🎁 БЛОК C — Вишлисты MVP

### C-01 · Миграция `wishlists` + `wishlist_items`
**Файл:** `personalhub/supabase/migrations/20260219113000_wishlists.sql`

**Что сделать:**
- `wishlists`:
  - `id`, `family_id`, `owner_member_id`, `title`, `is_shared`, `created_at`
- `wishlist_items`:
  - `id`, `wishlist_id`, `title`, `url`, `price`, `currency`, `priority`, `is_reserved`, `reserved_by`, `created_at`
- RLS:
  - private list видит владелец + admin
  - shared list видят члены семьи
  - reserve/edit по правилам владельца/admin

---

### C-02 · Actions для вишлистов
**Файл:** `personalhub/apps/web/lib/actions/wishlists.ts`

**Реализовать:**
- `getWishlistsAction()`
- `createWishlistAction(data)`
- `createWishlistItemAction(data)`
- `toggleReserveWishlistItemAction(itemId, reserved)`
- `deleteWishlistItemAction(itemId)`

---

### C-03 · Страница `/dashboard/wishlists`
**Файл:** `personalhub/apps/web/app/dashboard/wishlists/page.tsx`

**Компоненты:**
- `personalhub/apps/web/components/wishlists/WishlistCard.tsx`
- `personalhub/apps/web/components/wishlists/WishlistItem.tsx`
- `personalhub/apps/web/components/wishlists/WishlistDialog.tsx`

**Что реализовать:**
- Список вишлистов семьи.
- Добавление wishlist и items.
- Резервирование подарка.
- Пустое состояние + read-only поведение по permissions.

---

## 🔐 БЛОК D — Permissions Integration

### D-01 · Интегрировать `finances`/`wishlists` в UI gates
**Файлы:**
- `personalhub/apps/web/app/dashboard/layout.tsx`
- `personalhub/apps/web/components/layout/Sidebar.tsx`
- `personalhub/apps/web/components/layout/MobileNav.tsx`
- `personalhub/apps/web/app/dashboard/finances/page.tsx`
- `personalhub/apps/web/app/dashboard/wishlists/page.tsx`

**Что сделать:**
- Скрытие модулей при `can_view=false`.
- `notFound()` на уровне страницы при запрете.
- read-only UI при `can_edit=false`.

---

## 🧪 БЛОК E — E2E/CI Stabilization

### E-01 · Довести e2e до стабильного прогона
**Файлы:** `apps/web/e2e/*.spec.ts`

**Что сделать:**
- Убрать flaky-ожидания.
- Использовать предсказуемые селекторы.
- Разделить smoke и full flows.
- Добавить e2e для `finances` и `wishlists`.

---

### E-02 · CI workflow для web quality + e2e smoke
**Файл:** `.github/workflows/web-quality.yml`

**Что сделать:**
- Jobs:
  - install
  - `check-types -w web`
  - `lint -w web`
  - `node scripts/smoke/sprint02-smoke.mjs`
  - `npm run e2e -w web -- e2e/auth.spec.ts`
- Явно объявить required env secrets.

---

## 📋 Порядок выполнения

```text
A-01 → A-02 → A-03
    ↓
B-01 → B-02
    ↓
C-01 → C-02 → C-03
    ↓
D-01
    ↓
E-01 → E-02
```

---

## ✅ Definition of Done для Sprint 03

- [ ] `npm run check-types -w web` — 0 ошибок
- [ ] `npm run lint -w web` — 0 ошибок
- [ ] `npx supabase migration list` — local == remote
- [ ] Финансы: счета + транзакции + summary работают
- [ ] Вишлисты: создание, добавление items, reserve работают
- [ ] `finances` и `wishlists` полностью интегрированы в permissions gates
- [ ] E2E smoke стабильно проходит локально и в CI
- [ ] Обновлены `ARCHITECTURE.md` и `SPRINT_03_CHANGELOG.md`

