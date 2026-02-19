# PersonalHub — Sprint 05: Path to v1.0
> **Цель:** Завершить критичные фичи для полноценного production-ready продукта  
> **Фокус:** Stripe подписки + Notifications + Mobile app foundation + Production deployment

---

## 🎯 Что нужно для v1.0 (приоритизация)

### Tier 1 — MUST HAVE (без этого нельзя запускать)
1. ✅ Auth + Onboarding — **ГОТОВО**
2. ✅ Базовые модули (задачи/покупки/заметки) — **ГОТОВО**
3. ✅ Permissions система — **ГОТОВО**
4. ⏳ UI/UX polish — **Sprint 04 в процессе**
5. ❌ **Stripe подписки** — монетизация
6. ❌ **Production deployment** — выкатить на Vercel
7. ❌ **Error handling & logging** — не терять пользователей на багах

### Tier 2 — SHOULD HAVE (улучшают продукт)
8. ❌ **Notifications center** — уведомления внутри приложения
9. ❌ **Email notifications** — приглашения, напоминания
10. ❌ **Mobile app (MVP)** — React Native через Expo
11. ❌ **Onboarding tour** — первый визит пользователя
12. ❌ **Расширение финансов** — переводы, цели, долги

### Tier 3 — NICE TO HAVE (для v1.1)
13. ⏳ i18n (next-intl)
14. ⏳ Analytics (Posthog/Mixpanel)
15. ⏳ E2E стабилизация в CI
16. ⏳ Performance optimization

---

## 💳 БЛОК A — Stripe подписки (CRITICAL)

**Зачем:** Без монетизации нет бизнеса. Нужно дать возможность платить за Premium/Family+.

### A-01 · Stripe setup + products/prices

**Что сделать:**
1. Создать Stripe аккаунт (если нет)
2. Создать 3 продукта в Stripe Dashboard:
   - **Free** (нет price_id, встроенный)
   - **Premium** — $5.99/мес (или ₽499/мес)
   - **Family+** — $9.99/мес (или ₽799/мес)
3. Получить `price_id` каждого плана
4. Добавить в `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_FAMILY_PLUS_PRICE_ID=price_...
```

---

### A-02 · Миграция subscriptions

**Файл:** `supabase/migrations/20260220000000_subscriptions.sql`

```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID REFERENCES families(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan                  TEXT NOT NULL DEFAULT 'free'
                         CHECK (plan IN ('free','premium','family_plus')),
  status                TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','cancelled','expired','trial','past_due')),
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT
  USING (is_family_member(family_id));

CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE
  USING (is_family_admin(family_id));

-- Auto-create free subscription for new families
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (family_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_subscription
  AFTER INSERT ON families
  FOR EACH ROW EXECUTE FUNCTION create_free_subscription();
```

**После:** `npx supabase db push`

---

### A-03 · Stripe webhook endpoint

**Файл:** `apps/web/app/api/stripe/webhook/route.ts`

```typescript
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const familyId = session.metadata?.family_id
      const plan = session.metadata?.plan as 'premium' | 'family_plus'

      await supabase
        .from('subscriptions')
        .update({
          plan,
          status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq('family_id', familyId)

      // Update family plan
      await supabase
        .from('families')
        .update({ plan })
        .eq('id', familyId)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const status = subscription.status === 'active' ? 'active' :
                     subscription.status === 'past_due' ? 'past_due' :
                     subscription.status === 'canceled' ? 'cancelled' : 'expired'

      await supabase
        .from('subscriptions')
        .update({
          status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ plan: 'free', status: 'expired' })
        .eq('stripe_subscription_id', subscription.id)

      // Downgrade family to free
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('family_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (sub) {
        await supabase
          .from('families')
          .update({ plan: 'free' })
          .eq('id', sub.family_id)
      }
      break
    }
  }

  return Response.json({ received: true })
}
```

---

### A-04 · Billing actions

**Файл:** `apps/web/lib/actions/billing.ts`

```typescript
'use server'

import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createCheckoutSessionAction(
  plan: 'premium' | 'family_plus'
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id, families(name)')
    .eq('user_id', user.id)
    .single()

  if (!familyMember) throw new Error('No family')
  if (!familyMember.role === 'admin') throw new Error('Not admin')

  const priceId = plan === 'premium'
    ? process.env.STRIPE_PREMIUM_PRICE_ID
    : process.env.STRIPE_FAMILY_PLUS_PRICE_ID

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?cancelled=true`,
    metadata: {
      family_id: familyMember.family_id,
      plan,
    },
  })

  redirect(session.url!)
}

export async function createPortalSessionAction() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('family_id', familyMember.family_id)
    .single()

  if (!sub?.stripe_customer_id) throw new Error('No subscription')

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
  })

  redirect(session.url)
}
```

---

### A-05 · Billing UI page

**Файл:** `apps/web/app/dashboard/settings/billing/page.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { createCheckoutSessionAction, createPortalSessionAction } from '@/lib/actions/billing'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['До 4 участников', 'Задачи и покупки', 'Заметки', 'Список покупок'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 499,
    popular: true,
    features: ['До 8 участников', 'Все модули', 'Календарь', 'Финансы', 'Вишлисты'],
  },
  {
    id: 'family_plus',
    name: 'Family+',
    price: 799,
    features: ['Неограниченно участников', 'Документы', 'Приоритетная поддержка', 'История 5 лет'],
  },
]

export default async function BillingPage() {
  // Load current subscription...

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-semibold text-white mb-2">Подписка</h1>
      <p className="text-sm text-white/40 mb-8">Управляйте тарифом и оплатой</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className={cn(
            'relative',
            plan.popular && 'ring-2 ring-indigo-500'
          )}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Популярный
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1 mt-2">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold text-white">Бесплатно</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-white">{plan.price} ₽</span>
                    <span className="text-sm text-white/40">/месяц</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-white/70">{f}</span>
                  </li>
                ))}
              </ul>
              {currentPlan === plan.id ? (
                <Button variant="outline" disabled className="w-full">
                  Текущий план
                </Button>
              ) : plan.id === 'free' ? (
                <Button variant="ghost" disabled className="w-full">
                  Нельзя вернуться на Free
                </Button>
              ) : (
                <form action={createCheckoutSessionAction.bind(null, plan.id as any)}>
                  <Button type="submit" className="w-full">
                    Перейти на {plan.name}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stripe Portal button if has subscription */}
      {hasSubscription && (
        <div className="mt-8 p-6 bg-white/[0.03] border border-white/[0.07] rounded-xl">
          <h3 className="text-sm font-medium text-white mb-2">Управление подпиской</h3>
          <p className="text-xs text-white/40 mb-4">
            Обновите платёжные данные, просмотрите историю или отмените подписку
          </p>
          <form action={createPortalSessionAction}>
            <Button type="submit" variant="outline">
              Открыть Stripe Portal
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
```

---

## 🔔 БЛОК B — Notifications Center

**Зачем:** Пользователь должен видеть что кто-то принял приглашение, назначил задачу, забронировал подарок.

### B-01 · Миграция notifications

**Файл:** `supabase/migrations/20260220010000_notifications.sql`

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  family_id   UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL,  -- 'task_assigned', 'invite_accepted', 'item_reserved', etc.
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_family_id_idx ON notifications(family_id);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
```

---

### B-02 · Notification Bell в Header

**Файл:** `components/layout/NotificationBell.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/browser'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createBrowserClient()

  useEffect(() => {
    // Load notifications
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setNotifications(data ?? [])
        setUnreadCount(data?.filter(n => !n.is_read).length ?? 0)
      })

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
          <Bell className="h-5 w-5 text-white/70" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-white/40">
            Нет уведомлений
          </div>
        ) : (
          notifications.map(notif => (
            <DropdownMenuItem key={notif.id}>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{notif.title}</p>
                {notif.body && (
                  <p className="text-xs text-white/40 mt-0.5">{notif.body}</p>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

Добавить в `Header.tsx`.

---

## 🚀 БЛОК C — Production Deployment

### C-01 · Deploy на Vercel

**Шаги:**
1. Push код в GitHub
2. Импортировать проект в Vercel
3. Настроить env variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - остальные...
4. Deploy
5. Настроить webhook в Stripe → `https://yourapp.vercel.app/api/stripe/webhook`

---

### C-02 · Error tracking (Sentry)

```bash
npm install @sentry/nextjs -w web
npx @sentry/wizard@latest -i nextjs
```

Добавить в `.env`:
```env
NEXT_PUBLIC_SENTRY_DSN=https://...
```

---

### C-03 · Monitoring & logging

**Варианты:**
- **Vercel Analytics** (встроенный)
- **Sentry** (ошибки)
- **LogSnag** или **Better Stack** (логи и alerts)

---

## 📱 БЛОК D — Mobile App Foundation (optional для v1.0)

**Если есть время — начать мобилку. Если нет — отложить на v1.1.**

### D-01 · Setup Expo monorepo

```bash
cd apps
npx create-expo-app mobile
```

Настроить `turbo.json` для мобильного приложения.

### D-02 · Supabase auth в Expo

Использовать `@supabase/supabase-js` + deep links для OAuth.

### D-03 · Базовый UI — список задач

Первый экран — просто вывести список задач из API.

---

## 📋 Порядок выполнения Sprint 05

```
A-01 → A-02 → A-03 → A-04 → A-05  # Stripe (критично)
    ↓
B-01 → B-02                       # Notifications (важно)
    ↓
C-01 → C-02 → C-03                # Production (критично)
    ↓
D-01 → D-02 → D-03                # Mobile (если есть время)
```

---

## ✅ Definition of Done Sprint 05

### Must Have (v1.0)
- [ ] Stripe checkout работает — можно купить Premium
- [ ] Webhook обрабатывает события — plan обновляется в БД
- [ ] Billing page показывает текущий план + Portal кнопка
- [ ] Notification bell в header с real-time
- [ ] Production deploy на Vercel работает
- [ ] Sentry отлавливает ошибки
- [ ] Домен настроен (опционально)

### Nice to Have (v1.1)
- [ ] Mobile app — базовый список задач работает
- [ ] Email notifications через Resend/SendGrid
- [ ] Onboarding tour для новых пользователей
- [ ] Analytics (Posthog)

---

## 🎉 После Sprint 05 — у нас v1.0!

**Что можно:**
- Платить за продукт
- Приглашать участников
- Управлять задачами, покупками, заметками, календарём, финансами, вишлистами
- Получать уведомления
- Работать в production
- Отслеживать ошибки

**Далее — рост:**
- Marketing (Product Hunt, соц сети)
- User feedback
- Feature iterations
- Mobile app доработка

---

*После завершения обновить ARCHITECTURE.md до v1.0 и создать SPRINT_05_CHANGELOG.md*
