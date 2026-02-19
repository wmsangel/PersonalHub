# PersonalHub — Sprint 04 Addendum: Onboarding + Solo Mode

> **Дополнение к Sprint 04 TOTAL_VISUAL_OVERHAUL**  
> **Критические исправления:** empty state на главной + onboarding форма + solo mode

---

## 🔥 HOTFIX 1 — Функциональность без семьи (Solo Mode)

### Проблема
Пользователь не может пользоваться виджетами пока не создаст семью. Это плохо — нужно дать возможность работать в "личном режиме".

### Решение
Автоматически создавать "личное пространство" при первом входе.

---

### FIX-A1 · Авто-создание личного пространства

**Файл:** `apps/web/app/dashboard/page.tsx`

**Текущая логика:**
```tsx
if (!family) {
  return <EmptyState /> // блокирует доступ
}
```

**Новая логика:**
```tsx
// В Server Component
const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth')

// Проверяем есть ли семья
let { data: familyMember } = await supabase
  .from('family_members')
  .select('*, families(*)')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()

// Если нет семьи — создаём личное пространство автоматически
if (!familyMember) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Создаём семью
  const { data: newFamily } = await supabase
    .from('families')
    .insert({
      name: `${profile?.full_name || 'Моё'} пространство`,
      created_by: user.id,
      plan: 'free'
    })
    .select()
    .single()

  // Добавляем себя как admin
  await supabase
    .from('family_members')
    .insert({
      family_id: newFamily.id,
      user_id: user.id,
      role: 'admin',
      nickname: null,
      is_active: true
    })

  // Перезагружаем страницу чтобы увидеть дашборд
  redirect('/dashboard')
}

// Дальше обычная логика с виджетами
```

**Альтернативный подход (если не хочешь авто-создание):**

Показывать главную с пустыми виджетами и баннером "Работаете в личном режиме. [Создать семью]".

---

### FIX-A2 · Обновить middleware

**Файл:** `apps/web/middleware.ts`

Убрать redirect на `/dashboard/family` если нет семьи. Вместо этого просто пропускать в `/dashboard` — там уже сработает авто-создание.

```tsx
// Убрать этот блок:
if (!familyMember) {
  return NextResponse.redirect(new URL('/dashboard/family', request.url))
}
```

---

## 🎨 HOTFIX 2 — Empty State на главной (визуал)

### Проблема
Empty state на скрине 1 выглядит сыро — нет отступов, шаги неправильно, иконка мелкая.

### FIX-B1 · Красивый empty state

**Файл:** `apps/web/app/dashboard/page.tsx`

```tsx
{/* Если нет семьи ИЛИ показываем приглашение создать */}
<div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
  
  {/* Иконка с декоративными элементами */}
  <div className="relative mb-8">
    <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10
                    border border-indigo-500/10 flex items-center justify-center mx-auto">
      <Home className="h-11 w-11 text-indigo-400/60" />
    </div>
    {/* Декоративные точки */}
    <div className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-indigo-500/40 animate-pulse" />
    <div className="absolute -bottom-2 -left-2 h-2.5 w-2.5 rounded-full bg-violet-500/40 
                    animate-pulse" style={{ animationDelay: '0.5s' }} />
  </div>

  <h2 className="text-2xl font-semibold text-white mb-3 text-center">
    Добро пожаловать в PersonalHub
  </h2>
  <p className="text-sm text-white/40 max-w-md text-center leading-relaxed mb-10">
    Чтобы начать, создайте семейное пространство. 
    Затем пригласите близких и начните управлять жизнью вместе.
  </p>

  {/* Шаги — горизонтально */}
  <div className="flex items-center gap-4 mb-10">
    <div className="flex items-center gap-2.5">
      <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30
                      flex items-center justify-center">
        <span className="text-xs font-semibold text-indigo-400">1</span>
      </div>
      <span className="text-xs text-white/30">Создать семью</span>
    </div>

    <div className="w-10 h-px bg-white/10" />

    <div className="flex items-center gap-2.5">
      <div className="h-6 w-6 rounded-full bg-white/5 border border-white/10
                      flex items-center justify-center">
        <span className="text-xs font-semibold text-white/30">2</span>
      </div>
      <span className="text-xs text-white/30">Пригласить близких</span>
    </div>

    <div className="w-10 h-px bg-white/10" />

    <div className="flex items-center gap-2.5">
      <div className="h-6 w-6 rounded-full bg-white/5 border border-white/10
                      flex items-center justify-center">
        <span className="text-xs font-semibold text-white/30">3</span>
      </div>
      <span className="text-xs text-white/30">Начать работу</span>
    </div>
  </div>

  <Link href="/dashboard/family">
    <button className="inline-flex items-center gap-2.5 px-6 py-3
                       bg-gradient-to-r from-indigo-500 to-violet-600
                       hover:from-indigo-400 hover:to-violet-500
                       text-white text-sm font-semibold rounded-xl
                       shadow-[0_0_24px_rgba(99,102,241,0.25)]
                       hover:shadow-[0_4px_28px_rgba(99,102,241,0.35)]
                       hover:-translate-y-px
                       transition-all duration-150">
      <Users className="h-4 w-4" />
      Создать семейное пространство
    </button>
  </Link>

  <p className="text-xs text-white/20 mt-6">
    Вы станете администратором и сможете управлять доступом
  </p>
</div>
```

---

## 🎨 HOTFIX 3 — Onboarding форма (визуал)

### Проблема
На скрине 2 форма onboarding обрезана слева, нет отступов, поля плоские.

### FIX-C1 · Onboarding форма в семье

**Файл:** `apps/web/app/dashboard/family/page.tsx`

**Заменить секцию onboarding полностью:**

```tsx
{/* Если нет семьи — onboarding */}
{!family && (
  <div className="max-w-lg mx-auto py-16 px-4">
    
    {/* Иконка */}
    <div className="flex justify-center mb-8">
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-600/20
                        border border-rose-500/20 flex items-center justify-center">
          <Users className="h-9 w-9 text-rose-400" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-rose-500/40" />
        <div className="absolute -bottom-1.5 -left-1.5 h-2.5 w-2.5 rounded-full bg-pink-500/40" />
      </div>
    </div>

    {/* Текст */}
    <div className="text-center mb-10">
      <h2 className="text-2xl font-semibold text-white mb-3">
        Создайте семейное пространство
      </h2>
      <p className="text-sm text-white/40 leading-relaxed max-w-md mx-auto">
        Добавьте информацию о себе и вашей семье. 
        Вы станете администратором и сможете пригласить остальных.
      </p>
    </div>

    {/* Форма */}
    <form action={completeOnboardingAction}
          className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-5">
      
      <div>
        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
          Ваше имя
        </label>
        <input
          name="full_name"
          placeholder="Иван Иванов"
          required
          className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl
                     text-sm text-white placeholder:text-white/20
                     hover:border-white/[0.12] hover:bg-white/[0.07]
                     focus:border-rose-500/50 focus:bg-white/[0.07]
                     focus:shadow-[0_0_0_3px_rgba(244,63,94,0.08)]
                     outline-none transition-all duration-150"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
          Название семьи
        </label>
        <input
          name="family_name"
          placeholder="Семья Ивановых"
          required
          className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl
                     text-sm text-white placeholder:text-white/20
                     hover:border-white/[0.12] hover:bg-white/[0.07]
                     focus:border-rose-500/50 focus:bg-white/[0.07]
                     focus:shadow-[0_0_0_3px_rgba(244,63,94,0.08)]
                     outline-none transition-all duration-150"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
          Ваш никнейм <span className="text-white/20">(необязательно)</span>
        </label>
        <input
          name="nickname"
          placeholder="Папа, Мама..."
          className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl
                     text-sm text-white placeholder:text-white/20
                     hover:border-white/[0.12] hover:bg-white/[0.07]
                     focus:border-rose-500/50 focus:bg-white/[0.07]
                     focus:shadow-[0_0_0_3px_rgba(244,63,94,0.08)]
                     outline-none transition-all duration-150"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600
                   hover:from-rose-400 hover:to-pink-500
                   text-white font-semibold text-sm rounded-xl
                   shadow-[0_0_24px_rgba(244,63,94,0.25)]
                   hover:shadow-[0_4px_28px_rgba(244,63,94,0.35)]
                   hover:-translate-y-px
                   transition-all duration-150 mt-2">
        Создать семейное пространство →
      </button>
    </form>

    {/* Подсказка */}
    <p className="text-center text-xs text-white/20 mt-6">
      После создания вы сможете пригласить остальных участников семьи
    </p>
  </div>
)}
```

---

## 🎨 HOTFIX 4 — Sidebar на скринах обрезан

### Проблема
Sidebar показывает только "Главная" и "Семья" — остальные модули не видны.

### Возможные причины:
1. Не добавлены все модули в `navItems`
2. Скрыты через permissions (но семьи же нет — значит permissions не работают)
3. CSS обрезает контент

### FIX-D1 · Проверить navItems в Sidebar

**Файл:** `components/layout/Sidebar.tsx`

Убедиться что ВСЕ модули присутствуют:

```tsx
const navItems = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Главная',    color: 'text-slate-400'   },
  { href: '/dashboard/tasks',    icon: CheckSquare,     label: 'Задачи',     color: 'text-indigo-400'  },
  { href: '/dashboard/shopping', icon: ShoppingCart,    label: 'Покупки',    color: 'text-emerald-400' },
  { href: '/dashboard/notes',    icon: FileText,        label: 'Заметки',    color: 'text-amber-400'   },
  { href: '/dashboard/calendar', icon: CalendarDays,    label: 'Календарь',  color: 'text-violet-400'  },
  { href: '/dashboard/finances', icon: Wallet,          label: 'Финансы',    color: 'text-cyan-400'    },
  { href: '/dashboard/wishlists',icon: Gift,            label: 'Вишлисты',   color: 'text-pink-400'    },
  { href: '/dashboard/family',   icon: Users,           label: 'Семья',      color: 'text-rose-400'    },
]
```

### FIX-D2 · Отключить permission filtering пока нет семьи

**Файл:** `components/layout/Sidebar.tsx`

Если используется фильтрация по permissions — отключить её когда `family === null`:

```tsx
export function Sidebar({ permissions, family }: SidebarProps) {
  // Если нет семьи — показываем все модули
  const visibleItems = !family 
    ? navItems 
    : navItems.filter(item => {
        const module = getModuleFromHref(item.href)
        return !module || canViewModule(permissions, module)
      })

  return (
    <aside className="...">
      <nav className="...">
        {visibleItems.map(item => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  )
}
```

---

## ✅ Порядок исправлений

```
FIX-A1 → Auto-create personal space (или убрать блокировку)
FIX-A2 → Обновить middleware
FIX-B1 → Empty state на главной
FIX-C1 → Onboarding форма
FIX-D1 → Все модули в sidebar
FIX-D2 → Отключить permission filtering без семьи
```

---

## ✅ Проверка

После исправлений должно работать так:

1. Новый пользователь заходит → автоматически создаётся "Моё пространство"
2. Видит все модули в sidebar
3. Может сразу создавать задачи, заметки, покупки
4. Может пригласить людей через "Семья" когда захочет
5. Empty state красивый с правильными отступами
6. Onboarding форма центрирована и с правильными стилями
