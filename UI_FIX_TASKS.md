# PersonalHub — UI Fix Tasks (срочно)
> **Для:** Cursor AI Agent  
> **Приоритет:** КРИТИЧНО — делать ДО Sprint 03  
> **Проблема:** Dashboard выглядит сыро — нет sidebar'а, нулевые отступы, onboarding без стиля  
> **Проверка:** `npm run check-types -w web` + `npm run lint -w web` после каждой задачи

---

## 🔍 Что сейчас сломано (по скриншотам)

1. **Sidebar не отображается** — видна только тонкая линия слева, нет иконок и навигации
2. **Header пустой** — только "PersonalHub" слева и email справа, нет имени семьи, нет аватара с инициалами
3. **Onboarding форма** — плавает без контейнера, поля в ряд без стилей, кнопка не выделена
4. **Нулевые отступы** — контент прижат к верхнему левому углу, нет padding
5. **Главная страница** — только текст "Сначала заверши onboarding семьи" без стилей

---

## FIX-01 · Sidebar — полная переработка

**Файл:** `apps/web/components/layout/Sidebar.tsx`

Переписать полностью. Вот рабочий шаблон:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, ShoppingCart,
  FileText, Users, CalendarDays, Wallet, Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Главная',  color: 'text-slate-400'   },
  { href: '/dashboard/tasks',    icon: CheckSquare,     label: 'Задачи',   color: 'text-indigo-400'  },
  { href: '/dashboard/shopping', icon: ShoppingCart,    label: 'Покупки',  color: 'text-emerald-400' },
  { href: '/dashboard/notes',    icon: FileText,        label: 'Заметки',  color: 'text-amber-400'   },
  { href: '/dashboard/calendar', icon: CalendarDays,    label: 'Календарь',color: 'text-violet-400'  },
  { href: '/dashboard/finances', icon: Wallet,          label: 'Финансы',  color: 'text-cyan-400'    },
  { href: '/dashboard/wishlists',icon: Gift,            label: 'Вишлисты', color: 'text-pink-400'    },
  { href: '/dashboard/family',   icon: Users,           label: 'Семья',    color: 'text-rose-400'    },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0f0f0f] border-r border-white/[0.06] 
                      flex flex-col z-30 hidden md:flex">
      
      {/* Логотип */}
      <div className="h-14 flex items-center px-5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 
                          flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="font-semibold text-sm text-white">PersonalHub</span>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, color }) => {
          const isActive = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? color : '')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Нижняя часть — пустая пока, место для профиля */}
      <div className="h-14 border-t border-white/[0.06] px-3 flex items-center shrink-0">
        <div className="text-xs text-white/30 px-3">v0.4 MVP</div>
      </div>
    </aside>
  )
}
```

---

## FIX-02 · Header — переработка

**Файл:** `apps/web/components/layout/Header.tsx`

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { LogOut, Settings, User, ChevronDown } from 'lucide-react'
import { signOutAction } from '@/actions'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Маппинг путей → заголовки
const pageTitles: Record<string, string> = {
  '/dashboard':           'Главная',
  '/dashboard/tasks':     'Задачи',
  '/dashboard/shopping':  'Список покупок',
  '/dashboard/notes':     'Заметки',
  '/dashboard/calendar':  'Календарь',
  '/dashboard/finances':  'Финансы',
  '/dashboard/wishlists': 'Вишлисты',
  '/dashboard/family':    'Семья',
}

interface HeaderProps {
  userEmail?: string
  userName?: string
  familyName?: string
}

export function Header({ userEmail, userName, familyName }: HeaderProps) {
  const pathname = usePathname()

  // Получить заголовок текущей страницы
  const title = Object.entries(pageTitles)
    .reverse() // сначала более специфичные пути
    .find(([path]) => pathname.startsWith(path))?.[1] ?? 'PersonalHub'

  // Инициалы пользователя
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="h-14 flex items-center justify-between px-6 
                       border-b border-white/[0.06] bg-[#0a0a0a]/80 
                       backdrop-blur-sm sticky top-0 z-20">
      
      {/* Заголовок страницы */}
      <h1 className="text-base font-semibold text-white">{title}</h1>

      {/* Правая часть */}
      <div className="flex items-center gap-3">
        
        {/* Имя семьи */}
        {familyName && (
          <span className="text-xs text-white/40 hidden sm:block">
            {familyName}
          </span>
        )}

        {/* Аватар + дропдаун */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5
                               hover:bg-white/[0.06] transition-colors duration-150 outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-white/70 hidden sm:block max-w-[140px] truncate">
                {userName || userEmail}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-white/30" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52 bg-[#1a1a1a] border-white/[0.08]">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-white truncate">{userName || 'Пользователь'}</p>
              <p className="text-xs text-white/40 truncate">{userEmail}</p>
            </div>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem className="gap-2 text-white/70 hover:text-white focus:text-white 
                                         hover:bg-white/[0.06] focus:bg-white/[0.06] cursor-pointer">
              <User className="h-4 w-4" /> Профиль
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-white/70 hover:text-white focus:text-white 
                                         hover:bg-white/[0.06] focus:bg-white/[0.06] cursor-pointer">
              <Settings className="h-4 w-4" /> Настройки
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              className="gap-2 text-rose-400 hover:text-rose-300 focus:text-rose-300 
                         hover:bg-rose-500/10 focus:bg-rose-500/10 cursor-pointer"
              onClick={() => signOutAction()}
            >
              <LogOut className="h-4 w-4" /> Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

---

## FIX-03 · Dashboard Layout — правильная структура

**Файл:** `apps/web/app/dashboard/layout.tsx`

```tsx
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Получаем профиль и семью для header
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('families(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const familyName = (familyMember?.families as any)?.name

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      
      {/* Sidebar — фиксированный слева */}
      <Sidebar />

      {/* Основная область — отступ слева на ширину sidebar */}
      <div className="md:ml-60 flex flex-col min-h-screen">
        
        {/* Header */}
        <Header
          userEmail={user.email}
          userName={profile?.full_name}
          familyName={familyName}
        />

        {/* Контент страницы */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## FIX-04 · Onboarding форма — полный редизайн

**Файл:** `apps/web/app/dashboard/family/page.tsx` (секция onboarding)

Когда у пользователя нет семьи — показывать красивую onboarding карточку, а не сырую форму.

```tsx
{/* Если нет семьи — показываем onboarding */}
{!family && (
  <div className="max-w-lg mx-auto mt-16">
    
    {/* Иконка */}
    <div className="flex justify-center mb-6">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 
                      border border-indigo-500/20 flex items-center justify-center">
        <Users className="h-8 w-8 text-indigo-400" />
      </div>
    </div>

    {/* Текст */}
    <div className="text-center mb-8">
      <h2 className="text-2xl font-semibold text-white mb-2">
        Создай своё семейное пространство
      </h2>
      <p className="text-sm text-white/50 leading-relaxed">
        Пригласи близких, назначай задачи, ведите общие списки — 
        всё в одном месте без хаоса в мессенджерах.
      </p>
    </div>

    {/* Форма */}
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4">
      <div>
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
          Ваше имя
        </label>
        <input
          name="full_name"
          placeholder="Иван Иванов"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3
                     text-sm text-white placeholder:text-white/25
                     focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07]
                     transition-all duration-150"
        />
      </div>
      
      <div>
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
          Название семьи
        </label>
        <input
          name="family_name"
          placeholder="Семья Ивановых"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3
                     text-sm text-white placeholder:text-white/25
                     focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07]
                     transition-all duration-150"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
          Ваш никнейм (необязательно)
        </label>
        <input
          name="nickname"
          placeholder="Папа, Мама..."
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3
                     text-sm text-white placeholder:text-white/25
                     focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07]
                     transition-all duration-150"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 
                   hover:from-indigo-400 hover:to-violet-500
                   text-white font-medium py-3 rounded-xl text-sm
                   transition-all duration-150 mt-2
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        Создать семейное пространство →
      </button>
    </div>

    {/* Подпись */}
    <p className="text-center text-xs text-white/25 mt-4">
      Вы станете администратором и сможете пригласить остальных
    </p>
  </div>
)}
```

---

## FIX-05 · Главная страница — состояние "без семьи"

**Файл:** `apps/web/app/dashboard/page.tsx`

Сейчас показывает: *"Сначала заверши onboarding семьи. Перейти в /dashboard/family"*

Заменить на красивый empty state:

```tsx
{/* Если нет семьи */}
{!family && (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    
    {/* Большая иконка */}
    <div className="relative mb-8">
      <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10 
                      border border-indigo-500/10 flex items-center justify-center mx-auto">
        <Home className="h-10 w-10 text-indigo-400/60" />
      </div>
      {/* Декоративные точки */}
      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-500/40" />
      <div className="absolute -bottom-2 -left-2 h-2 w-2 rounded-full bg-violet-500/40" />
    </div>

    <h2 className="text-2xl font-semibold text-white mb-3">
      Добро пожаловать в PersonalHub
    </h2>
    <p className="text-sm text-white/40 max-w-sm leading-relaxed mb-8">
      Чтобы начать, создай семейное пространство. 
      Затем пригласи близких и начните управлять жизнью вместе.
    </p>

    {/* Шаги */}
    <div className="flex items-center gap-3 mb-8 text-xs text-white/30">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 
                        flex items-center justify-center text-indigo-400 font-medium">1</div>
        Создать семью
      </div>
      <div className="w-8 h-px bg-white/10" />
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-white/5 border border-white/10 
                        flex items-center justify-center text-white/30 font-medium">2</div>
        Пригласить близких
      </div>
      <div className="w-8 h-px bg-white/10" />
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-white/5 border border-white/10 
                        flex items-center justify-center text-white/30 font-medium">3</div>
        Начать работу
      </div>
    </div>

    <Link
      href="/dashboard/family"
      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 
                 hover:from-indigo-400 hover:to-violet-500
                 text-white text-sm font-medium px-6 py-3 rounded-xl
                 transition-all duration-150"
    >
      <Users className="h-4 w-4" />
      Создать семейное пространство
    </Link>
  </div>
)}
```

---

## FIX-06 · globals.css — базовые стили

**Файл:** `apps/web/app/globals.css`

Убедиться что есть эти базовые правила:

```css
@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-[#0a0a0a] text-white antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Скроллбар в стиле темы */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.15);
  }

  /* Убрать outline у всех элементов — используем focus-visible */
  *:focus {
    outline: none;
  }

  /* Placeholder цвет */
  ::placeholder {
    color: rgba(255,255,255,0.25);
  }
}
```

---

## FIX-07 · Mobile Nav (нижняя панель на мобиле)

**Файл:** `apps/web/components/layout/MobileNav.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, ShoppingCart, Users, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Главная'  },
  { href: '/dashboard/tasks',    icon: CheckSquare,     label: 'Задачи'   },
  { href: '/dashboard/shopping', icon: ShoppingCart,    label: 'Покупки'  },
  { href: '/dashboard/calendar', icon: CalendarDays,    label: 'Календарь'},
  { href: '/dashboard/family',   icon: Users,           label: 'Семья'    },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden
                    bg-[#0f0f0f]/95 backdrop-blur-md 
                    border-t border-white/[0.06]
                    flex items-center justify-around
                    pb-safe">  {/* safe area для iPhone */}
      {mobileNavItems.map(({ href, icon: Icon, label }) => {
        const isActive = href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-3 min-w-0"
          >
            <Icon className={cn(
              'h-5 w-5 transition-colors',
              isActive ? 'text-indigo-400' : 'text-white/30'
            )} />
            <span className={cn(
              'text-[10px] font-medium truncate transition-colors',
              isActive ? 'text-indigo-400' : 'text-white/30'
            )}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
```

Подключить в `dashboard/layout.tsx` рядом с `<Sidebar />`.

---

## ✅ Порядок выполнения

```
FIX-06  →  globals.css (основа)
FIX-01  →  Sidebar (структура)
FIX-02  →  Header (структура)
FIX-03  →  Dashboard Layout (собрать вместе)
FIX-07  →  MobileNav
FIX-04  →  Onboarding форма
FIX-05  →  Главная страница empty state
```

## ✅ Definition of Done

- [ ] Sidebar отображается на всех страницах дашборда
- [ ] В sidebar активный пункт подсвечен, иконка цветная
- [ ] Header показывает заголовок страницы + аватар с инициалами + дропдаун
- [ ] Onboarding: центрированная карточка, красивые поля, градиентная кнопка
- [ ] Главная без семьи: красивый empty state с кнопкой
- [ ] На мобиле: нижняя навигация вместо sidebar
- [ ] `npm run check-types -w web` — 0 ошибок
- [ ] `npm run lint -w web` — 0 ошибок
