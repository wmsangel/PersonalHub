'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  CheckSquare,
  FileText,
  Gift,
  House,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: House, label: 'Обзор', module: null, accent: 'from-slate-400/30 to-white/5', iconColor: 'text-slate-200' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'Задачи', module: 'tasks', accent: 'from-indigo-500/30 to-indigo-500/5', iconColor: 'text-indigo-300' },
  { href: '/dashboard/shopping', icon: ShoppingCart, label: 'Покупки', module: 'shopping', accent: 'from-emerald-500/30 to-emerald-500/5', iconColor: 'text-emerald-300' },
  { href: '/dashboard/notes', icon: FileText, label: 'Заметки', module: 'notes', accent: 'from-amber-500/30 to-amber-500/5', iconColor: 'text-amber-300' },
  { href: '/dashboard/calendar', icon: CalendarDays, label: 'Календарь', module: 'calendar', accent: 'from-violet-500/30 to-violet-500/5', iconColor: 'text-violet-300' },
  { href: '/dashboard/finances', icon: Wallet, label: 'Финансы', module: 'finances', accent: 'from-cyan-500/30 to-cyan-500/5', iconColor: 'text-cyan-300' },
  { href: '/dashboard/wishlists', icon: Gift, label: 'Вишлисты', module: 'wishlists', accent: 'from-pink-500/30 to-pink-500/5', iconColor: 'text-pink-300' },
  { href: '/dashboard/family', icon: Users, label: 'Семья', module: null, accent: 'from-rose-500/30 to-rose-500/5', iconColor: 'text-rose-300' },
] as const

interface SidebarProps {
  visibleModules?: string[]
}

export function Sidebar({ visibleModules = [] }: SidebarProps) {
  const pathname = usePathname()

  const filteredItems =
    visibleModules.length === 0
      ? navItems
      : navItems.filter((item) => !item.module || visibleModules.includes(item.module))

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-full w-[292px] xl:w-[304px] md:flex">
      <div className="absolute inset-0 border-r border-white/8 bg-[#090b11]/88 backdrop-blur-2xl" />
      <div className="pointer-events-none absolute inset-x-6 top-5 h-28 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-2 h-72 w-72 rounded-full bg-indigo-500/12 blur-3xl" />

      <div className="relative flex w-full flex-col px-5 pb-6 pt-5 xl:px-6">
        <div className="mb-6 flex items-center gap-3 rounded-[1.35rem] border border-white/8 bg-white/[0.04] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.35)]">
            PH
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-white">PersonalHub</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/60">Family OS</p>
          </div>
        </div>

        <div className="mb-5 px-1">
          <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-white/28">Навигация</p>
          <p className="max-w-[210px] text-[12px] leading-5 text-white/42">
            Единое пространство для семьи, задач, заметок и денег без лишнего шума.
          </p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {filteredItems.map(({ href, icon: Icon, label, accent, iconColor }) => {
            const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group relative flex items-center gap-3 overflow-hidden rounded-[1.15rem] border px-3.5 py-3 transition-all duration-200 ease-out',
                  isActive
                    ? 'border-white/14 bg-white/[0.08] shadow-[0_14px_38px_rgba(0,0,0,0.18)]'
                    : 'border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.045]'
                )}
              >
                <div className={cn('absolute inset-0 opacity-0 transition-opacity duration-200', isActive && 'opacity-100')}>
                  <div className={cn('absolute inset-0 bg-gradient-to-r', accent)} />
                </div>

                <div
                  className={cn(
                    'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200',
                    isActive
                      ? 'border-white/12 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                      : 'border-white/8 bg-white/[0.03] group-hover:border-white/12 group-hover:bg-white/[0.06]'
                  )}
                >
                  <Icon className={cn('h-[18px] w-[18px] transition-colors duration-200', isActive ? iconColor : 'text-white/42 group-hover:text-white/78')} />
                </div>

                <div className="relative min-w-0 flex-1">
                  <p className={cn('truncate text-[14px] font-medium tracking-tight transition-colors duration-200', isActive ? 'text-white' : 'text-white/66 group-hover:text-white')}>
                    {label}
                  </p>
                  <p className={cn('mt-0.5 truncate text-[11px] transition-colors duration-200', isActive ? 'text-white/55' : 'text-white/28 group-hover:text-white/42')}>
                    {href === '/dashboard' ? 'Обзор активности и модулей' : 'Открыть раздел'}
                  </p>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/28">Workspace</p>
          <p className="mt-2 text-[14px] font-medium text-white">Sprint 05</p>
          <p className="mt-1 text-[12px] leading-5 text-white/42">
            Делаем интерфейс спокойным, аккуратным и действительно повседневно удобным.
          </p>
        </div>
      </div>
    </aside>
  )
}
