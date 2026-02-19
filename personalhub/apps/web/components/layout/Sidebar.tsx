'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, ShoppingCart,
  FileText, Users, CalendarDays, Wallet, Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Главная',   color: 'text-slate-400'   },
  { href: '/dashboard/tasks',     icon: CheckSquare,     label: 'Задачи',    color: 'text-indigo-400', module: 'tasks' },
  { href: '/dashboard/shopping',  icon: ShoppingCart,    label: 'Покупки',   color: 'text-emerald-400', module: 'shopping' },
  { href: '/dashboard/notes',     icon: FileText,        label: 'Заметки',   color: 'text-amber-400', module: 'notes' },
  { href: '/dashboard/calendar',  icon: CalendarDays,    label: 'Календарь', color: 'text-violet-400', module: 'calendar' },
  { href: '/dashboard/finances',  icon: Wallet,          label: 'Финансы',   color: 'text-cyan-400', module: 'finances' },
  { href: '/dashboard/wishlists', icon: Gift,            label: 'Вишлисты',  color: 'text-pink-400', module: 'wishlists' },
  { href: '/dashboard/family',    icon: Users,           label: 'Семья',     color: 'text-rose-400'    },
]

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
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0f0f11] border-r border-white/[0.06]
                      flex flex-col z-30 hidden md:flex overflow-hidden">
      <div className="absolute -bottom-32 -left-20 h-[500px] w-[500px] rounded-full
                      bg-indigo-600/[0.08] blur-3xl pointer-events-none" />

      <div className="relative h-16 flex items-center px-5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-[9px] bg-gradient-to-br from-indigo-500 to-violet-600
                          flex items-center justify-center text-white text-xs font-bold shrink-0
                          shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            P
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">PersonalHub</span>
        </div>
      </div>

      <nav className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map(({ href, icon: Icon, label, color }) => {
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

      <div className="relative h-14 border-t border-white/[0.06] px-5 flex items-center shrink-0">
        <span className="text-[11px] text-white/20 font-medium tracking-wide">v0.5 · Sprint 04</span>
      </div>
    </aside>
  )
}
