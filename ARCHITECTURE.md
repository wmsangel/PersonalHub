# PersonalHub — Architecture Document
> **Version:** 0.7  
> **Last updated:** 2026-02-19  
> 📌 Давай этот файл в начало каждой сессии с ИИ — он знает всё о проекте.

---

## 1. Концепция

**PersonalHub** — семейный органайзер с ролевой системой доступа.  
Единое пространство для управления задачами, финансами, календарём и другими аспектами жизни семьи.

**Ключевая идея:** Администратор (родитель) полностью контролирует что видит каждый участник семьи.

---

## 2. Стек технологий

```
Монорепо           →  Turborepo
Frontend (Web)     →  Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Mobile             →  React Native (Expo) + TypeScript       [запланировано: v1.0]
Backend            →  Supabase (PostgreSQL + Auth + Realtime + Storage)
Real-time          →  Supabase Realtime (WebSockets)
Кэш                →  Upstash Redis (serverless)              [запланировано]
Файлы              →  Cloudflare R2                           [запланировано]
Деплой Web         →  Vercel (автодеплой из GitHub)
Платежи            →  Stripe (международные) + ЮKassa (СНГ, позже)
i18n               →  next-intl                               [запланировано]
```

---

## 3. Структура репозитория

```
personalhub/
├── apps/
│   └── web/                                         ✅ ГОТОВО
│       ├── app/
│       │   ├── page.tsx                             ✅ redirect по сессии (/ → /auth или /dashboard)
│       │   ├── layout.tsx                           ✅
│       │   ├── auth/
│       │   │   └── page.tsx                         ✅ вход / регистрация
│       │   ├── dashboard/
│       │   │   ├── page.tsx                         ✅ виджет-сетка + visual polish
│       │   │   ├── layout.tsx                       ✅ sidebar/header/mobile nav + notifications + auto family bootstrap
│       │   │   ├── family/page.tsx                  ✅ участники, инвайты, настройки семьи + права модулей
│       │   │   ├── tasks/page.tsx                   ✅ задачи (CRUD + фильтры + dialog + permission gates)
│       │   │   ├── shopping/page.tsx                ✅ список покупок + realtime + permission gates
│       │   │   ├── notes/page.tsx                   ✅ заметки + editor + автосохранение + permission gates
│       │   │   ├── calendar/page.tsx                ✅ календарь MVP (month view + CRUD)
│       │   │   ├── finances/page.tsx                ✅ финансы MVP (summary + счета + транзакции + фильтры)
│       │   │   ├── wishlists/page.tsx               ✅ вишлисты MVP (списки + items + reserve)
│       │   │   └── settings/billing/page.tsx        ✅ billing page (plans + checkout + portal)
│       │   └── invite/
│       │       └── accept/
│       │           └── page.tsx                     ✅ принятие приглашения
│       │   └── api/
│       │       └── stripe/
│       │           └── webhook/route.ts             ✅ Stripe webhook
│       ├── lib/
│       │   ├── supabase/
│       │   │   ├── browser.ts                       ✅ клиент для клиентского кода
│       │   │   ├── server.ts                        ✅ клиент для Server Components
│       │   │   ├── shared.ts                        ✅ общие утилиты
│       │   │   └── admin.ts                         ✅ service role клиент
│       │   ├── env.ts                               ✅ типизированные env-переменные
│       │   ├── constants.ts                         ✅ placeholder-константы
│       │   ├── stripe.ts                            ✅ Stripe server client singleton
│       │   ├── invites.ts                           ✅ expirePendingInvites(familyId)
│       │   ├── hooks/useFamily.ts                   ✅ текущая семья в контексте
│       │   ├── permissions.ts                       ✅ canView/canEdit/assert helpers
│       │   └── actions/                             ✅ module actions (+ billing)
│       ├── actions.ts                               ✅ все server actions
│       ├── middleware.ts                            ✅ refresh сессии
│       ├── components/
│       │   ├── layout/                              ✅ Sidebar/Header/MobileNav/NotificationBell/NoFamilyState
│       │   ├── family/                              ✅ PermissionsDialog/PermissionRow
│       │   ├── tasks/                               ✅ TaskItem/TaskFilters/TaskDialog
│       │   ├── shopping/                            ✅ ShoppingItem/AddItemForm/ShoppingBoard
│       │   ├── notes/                               ✅ NoteCard/NoteEditor/ColorPicker
│       │   ├── calendar/                            ✅ CalendarHeader/CalendarDayGrid/EventDialog
│       │   ├── finances/                            ✅ AccountsPanel/TransactionList/TransactionDialog/SummaryCards
│       │   ├── wishlists/                           ✅ WishlistCard/WishlistItem/WishlistDialog
│       │   └── providers/                           ✅ Theme/Toast/Family providers
│       ├── e2e/                                     ✅ playwright specs (auth/tasks/shopping/notes/permissions/finances/wishlists)
│       ├── playwright.config.ts                     ✅
│       ├── .env.example                             ✅
│       └── .env.local                               ✅ (не в git)
├── packages/
│   └── types/
│       └── src/
│           ├── database.ts                          ✅ сгенерированные типы Supabase
│           └── index.ts                             ✅ алиасы типов домена
├── supabase/
│   ├── config.toml                                  ✅ project_id + major_version 17
│   └── migrations/
│       ├── 20260217000000_initial_family_schema.sql ✅ applied
│       ├── 20260217132000_family_core_rls.sql       ✅ applied
│       ├── 20260217143000_family_invites.sql        ✅ applied
│       ├── 20260217200000_tasks.sql                 ✅ applied
│       ├── 20260217210000_shopping.sql              ✅ applied
│       ├── 20260217220000_notes.sql                 ✅ applied
│       ├── 20260217223000_shopping_realtime.sql     ✅ applied
│       ├── 20260218090000_member_permissions.sql    ✅ applied
│       ├── 20260218093000_member_permissions_seed.sql ✅ applied
│       ├── 20260218103000_calendar.sql              ✅ applied
│       ├── 20260219090000_finance_categories.sql    ✅ applied
│       ├── 20260219093000_accounts.sql              ✅ applied
│       ├── 20260219100000_transactions.sql          ✅ applied
│       ├── 20260219113000_wishlists.sql             ✅ applied
│       ├── 20260220000000_subscriptions.sql         ✅ applied
│       └── 20260220010000_notifications.sql         ✅ applied
├── scripts/
│   └── smoke/
│       └── sprint02-smoke.mjs                       ✅
├── .github/
│   └── workflows/
│       └── web-quality.yml                          ✅ check-types + lint + smoke + auth e2e
├── ARCHITECTURE.md                                  ✅ этот файл
├── README.md                                        ✅
├── turbo.json
└── package.json
```

---

## 4. Роли и система доступа

```
ADMIN (Администратор)
  └── Полный доступ ко всему
  └── Управляет ролями участников
  └── Настраивает видимость модулей для каждого участника
  └── Может приглашать и отзывать инвайты

ADULT (Взрослый участник — муж/жена)
  └── Доступ по настройке администратора
  └── По умолчанию: всё кроме настроек семьи

CHILD (Ребёнок)
  └── Доступ только к разрешённым модулям
  └── По умолчанию: задачи (назначенные), список покупок, личный вишлист
  └── Финансы — ЗАКРЫТЫ по умолчанию

GUEST (Гость — няня, бабушка)
  └── Временный доступ
  └── Только явно разрешённое (например, список покупок)
```

---

## 5. База данных (PostgreSQL / Supabase)

### Supabase Project
- **Project ID:** `sadibgrhgljcpbotumfu`
- **PostgreSQL major version:** 17
- **Статус миграций:** local == remote ✅

---

### 5.1 Пользователи и семьи ✅ ПРИМЕНЕНО

```sql
-- profiles (расширяет auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  locale      TEXT DEFAULT 'ru',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- families
CREATE TABLE families (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_by  UUID REFERENCES profiles(id) NOT NULL,
  plan        TEXT DEFAULT 'free'
               CHECK (plan IN ('free', 'premium', 'family_plus')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- family_members
CREATE TABLE family_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'child'
               CHECK (role IN ('admin', 'adult', 'child', 'guest')),
  nickname    TEXT,
  color       TEXT DEFAULT '#6366f1',
  is_active   BOOLEAN DEFAULT true,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (family_id, user_id)
);
```

### 5.2 RLS политики ✅ ПРИМЕНЕНО

Helper-функции:
- `is_family_member(family_id)` — текущий пользователь в семье
- `is_family_admin(family_id)` — текущий пользователь admin
- `can_view_profile(profile_id)` — доступ к профилю

RLS включён на: `profiles`, `families`, `family_members`

### 5.3 Инвайты ✅ ПРИМЕНЕНО

```sql
CREATE TABLE family_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID REFERENCES families(id) ON DELETE CASCADE,
  invited_by    UUID REFERENCES profiles(id),
  email         TEXT NOT NULL,
  role          TEXT DEFAULT 'adult' CHECK (role IN ('admin','adult','child','guest')),
  status        TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (family_id, email, status)  -- уникальный pending на email
);
```

### 5.4 Настройки доступа ✅ ПРИМЕНЕНО

```sql
CREATE TABLE member_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID REFERENCES families(id) ON DELETE CASCADE,
  member_id   UUID REFERENCES family_members(id) ON DELETE CASCADE,
  module      TEXT NOT NULL
               CHECK (module IN ('calendar','tasks','notes','finances','wishlists','shopping','documents')),
  can_view    BOOLEAN DEFAULT true,
  can_edit    BOOLEAN DEFAULT false,
  UNIQUE (member_id, module)
);
```

RLS:
- `SELECT`: любой активный член семьи
- `INSERT/UPDATE/DELETE`: только семейный `admin`
- Добавлен seed + trigger для авто-заполнения прав при создании `family_members`

### 5.5 Виджеты ✅ SPRINT 03 ЗАКРЫТ

| Модуль | Таблицы | Статус |
|--------|---------|--------|
| Задачи | `tasks` | ✅ реализовано |
| Список покупок | `shopping_lists`, `shopping_items` | ✅ реализовано |
| Заметки | `notes` | ✅ реализовано |
| Календарь | `events`, `event_visibility` | ✅ реализовано (MVP) |
| Финансы | `accounts`, `transactions`, `finance_categories` | ✅ реализовано (MVP) |
| Вишлисты | `wishlists`, `wishlist_items` | ✅ реализовано (MVP) |
| Документы | `documents` | ⏳ v2.0 |
| Подписки | `subscriptions` | ✅ Sprint 05 |
| Уведомления | `notifications` | ✅ Sprint 05 |

---

## 6. Server Actions (actions.ts) ✅

| Action | Описание |
|--------|----------|
| `signInAction` | Вход по email/password |
| `signUpAction` | Регистрация |
| `signOutAction` | Выход |
| `completeOnboardingAction` | Создаёт profile + family + добавляет себя как admin |
| `inviteMemberAction` | Приглашение. Проверки: admin-права, self-invite, дубли pending. Сценарии: existing / new user |
| `acceptInviteAction` | Принятие инвайта. Обновляет профиль + nickname, статус → accepted |
| `revokeInviteAction` | Admin отзывает pending-инвайт |

Дополнительно (`lib/actions`):
- `createCheckoutSessionAction(plan)` — запускает Stripe Checkout для админа семьи
- `createPortalSessionAction()` — открывает Stripe Billing Portal

---

## 7. Маршрутизация

| Путь | Описание | Доступ |
|------|----------|--------|
| `/` | Редирект по сессии | Все |
| `/auth` | Вход / Регистрация | Только гости |
| `/dashboard` | Основной интерфейс | Только авторизованные |
| `/dashboard/settings/billing` | Тарифы и управление подпиской | Авторизованные (admin billing controls) |
| `/api/stripe/webhook` | Обработка Stripe webhook | Stripe |
| `/invite/accept` | Принятие приглашения | Авторизованные + есть инвайт |

**Middleware:** refresh сессии Supabase на каждом запросе. Авто-redirect приглашённого на `/invite/accept` до завершения профиля.

---

## 8. Invite Lifecycle

```
Admin создаёт инвайт
        ↓
  status: pending  (TTL 7 дней)
        ↓
  ┌─────────────────────────┐
  │                         │
Принят пользователем    Admin отозвал
  ↓                         ↓
accepted                 revoked

+ expirePendingInvites(familyId) → pending → expired (по expires_at)
```

---

## 9. Dashboard — текущий функционал ✅

- `/dashboard` — виджет-сетка: задачи, покупки, заметки, участники семьи
- `/dashboard/tasks` — CRUD задач, фильтры, назначение исполнителя, приоритеты
- `/dashboard/shopping` — список покупок с realtime hook и очисткой купленного
- `/dashboard/notes` + `/dashboard/notes/[id]` — карточки заметок, редактор, автосохранение
- `/dashboard/calendar` — месяц 7x6, навигация по месяцам, CRUD событий
- `/dashboard/finances` — summary карточки, счета, транзакции, фильтры, create/delete
- `/dashboard/wishlists` — CRUD вишлистов/items, reserve/unreserve, private/shared visibility
- `/dashboard/family` — участники, приглашения, управление семьёй
- `/dashboard/settings/billing` — планы Free/Premium/Family+, checkout, portal
- Permission-gate: скрытие модулей в навигации + server-page доступ + read-only UI
- Layout: sidebar + header + mobile nav + dark mode
- Notification bell в header + realtime updates из `notifications`
- Если у пользователя нет семьи: auto-bootstrap личного family space в `dashboard/layout`
- Модули не падают в 404 без семьи: отображают `NoFamilyState` с переходом в "Семья"
- Toast-уведомления через `sonner` в ключевых действиях

---

## 10. Монетизация

| Тариф | Цена | Лимиты |
|-------|------|--------|
| **Free** | Бесплатно | До 4 участников, базовые виджеты |
| **Premium** | ~$4-6/мес | Все виджеты, до 8 участников, история 1 год |
| **Family+** | ~$8-10/мес | Всё + документы, неограниченная история |
| **Донат** | Любая сумма | ☕ |

---

## 11. Переменные окружения

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PREMIUM_PRICE_ID=
STRIPE_FAMILY_PLUS_PRICE_ID=

# Error tracking
NEXT_PUBLIC_SENTRY_DSN=

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://personalhub.app
```

---

## 12. Роадмап

### ✅ Сделано (MVP — фундамент)
- [x] Монорепо (Turborepo) + Next.js 16
- [x] Supabase подключение (browser / server / admin / shared clients)
- [x] БД: profiles, families, family_members
- [x] RLS политики + helper-функции
- [x] Invite система (полный lifecycle)
- [x] Auth (sign in / sign up / sign out)
- [x] Onboarding (создание семьи)
- [x] Dashboard: управление инвайтами (поиск, фильтры, пагинация, сортировка)
- [x] Middleware (session refresh + invite redirect)
- [x] TypeScript checks ✅ + Lint ✅

### ✅ Sprint 01 завершён
- [x] Дизайн-система (shadcn/ui + токены + тёмная тема)
- [x] Dashboard layout (sidebar/header/mobile nav)
- [x] Типы БД и `useFamily` контекст
- [x] Задачи: миграция + actions + UI
- [x] Покупки: миграция + actions + UI + realtime wiring
- [x] Заметки: миграция + actions + UI + редактор
- [x] Семья: перенос управления участниками/инвайтами на `/dashboard/family`
- [x] Главная `/dashboard`: виджет-сетка

### ✅ Sprint 02 завершён
- [x] `member_permissions` таблица + RLS + seed/trigger
- [x] UI управления доступами участников семьи
- [x] Календарь (`events`, `event_visibility`) + server actions + month-view UI
- [x] Permission gates для модулей (nav/page/read-only)
- [x] Visual polish auth/dashboard
- [x] Playwright e2e scaffolding для критичных сценариев
- [x] Smoke script `scripts/smoke/sprint02-smoke.mjs`

### ✅ Sprint 03 завершён
- [x] Финансы MVP: `finance_categories`, `accounts`, `transactions` + RLS/валидации
- [x] Вишлисты MVP: `wishlists`, `wishlist_items` + reserve rules + RLS
- [x] Actions и UI для `/dashboard/finances` и `/dashboard/wishlists`
- [x] Permissions integration для `finances`/`wishlists` в layout/nav/pages
- [x] E2E стабилизация: `[smoke]`/`[full]` разделение + новые spec для finances/wishlists
- [x] CI workflow: `.github/workflows/web-quality.yml`

### ✅ Sprint 04 завершён (Total Visual Overhaul + Addendum)
- [x] Общий визуальный язык приведён к единому стандарту на auth/dashboard экранах
- [x] Обновлены Sidebar/Header/MobileNav (глубина, hover, отступы, читаемость)
- [x] Переполированы все ключевые модули: Dashboard, Tasks, Shopping, Notes, Calendar, Finances, Wishlists, Family
- [x] Исправлены критические визуальные и UX-регрессии из Addendum (A1/A2/B1/C1/D1/D2)
- [x] Включён auto-bootstrap personal space для нового пользователя при входе в dashboard
- [x] Восстановлена консистентная видимость модулей в sidebar/mobile при пустом наборе прав
- [x] TypeScript checks ✅ + Lint ✅ после финальных правок

### 🚧 Sprint 05 в работе (Path to v1.0)
- [x] Stripe data layer: `subscriptions` + RLS + auto free-subscription trigger
- [x] Stripe webhook endpoint: `/api/stripe/webhook`
- [x] Billing actions + billing page (`/dashboard/settings/billing`)
- [x] Notifications data layer: `notifications` + RLS + realtime publication
- [x] Notification bell в header (live updates + mark read)
- [x] UX: авто-bootstrap семьи на dashboard + no-family states вместо 404
- [x] Sentry package installed (`@sentry/nextjs`)
- [ ] Stripe Dashboard products/prices + реальные `price_id` в env
- [ ] Vercel deployment + env setup + webhook registration
- [ ] Sentry wizard/init + DSN wiring

### 🔜 Следующий шаг (после Sprint 05)
- [ ] Расширение финансов: переносы между счетами, цели накоплений, долги
- [ ] Улучшение e2e data seeding для полностью детерминированных full-flow тестов
- [ ] Сценарии с несколькими ролями (admin/adult/child/guest) в CI
- [ ] Улучшение realtime/online presence и UX micro-interactions

### 📅 v1.0
- [ ] Календарь (личный + семейный)
- [ ] Финансы (транзакции, бюджет, цели, долги)
- [ ] Вишлисты
- [ ] Stripe подписки
- [ ] Мобильное приложение (Expo)

### 📅 v2.0
- [ ] Документы (хранение сканов)
- [ ] Трекер привычек (для детей — звёздочки)
- [ ] Push + email уведомления
- [ ] Аналитика финансов
- [ ] i18n (next-intl): ru, en, de, es, tr
- [ ] ЮKassa для СНГ

---

## 13. Команды разработки

```bash
# Dev-сервер
npm run dev -w web

# Проверка типов
npm run check-types -w web

# Линтер
npm run lint -w web

# Supabase
npx supabase db push              # применить миграции в remote
npx supabase migration new <name> # создать новую миграцию
npx supabase db diff              # diff между local и remote
npx supabase db pull              # синхронизировать remote → local
```

---

*Этот документ — живой. Обновляй его при каждом архитектурном решении.*
