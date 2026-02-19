'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, ShoppingCart, Users, CalendarDays, Wallet, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Главная' },
  { href: '/dashboard/tasks',     icon: CheckSquare,     label: 'Задачи', module: 'tasks' },
  { href: '/dashboard/shopping',  icon: ShoppingCart,    label: 'Покупки', module: 'shopping' },
  { href: '/dashboard/calendar',  icon: CalendarDays,    label: 'Календарь', module: 'calendar' },
  { href: '/dashboard/finances',  icon: Wallet,          label: 'Финансы', module: 'finances' },
  { href: '/dashboard/wishlists', icon: Gift,            label: 'Вишлисты', module: 'wishlists' },
  { href: '/dashboard/family',    icon: Users,           label: 'Семья' },
]

interface MobileNavProps {
  visibleModules?: string[]
}

export function MobileNav({ visibleModules = [] }: MobileNavProps) {
  const pathname = usePathname()
  const filteredItems =
    visibleModules.length === 0
      ? mobileNavItems
      : mobileNavItems.filter((item) => !item.module || visibleModules.includes(item.module))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden
                    bg-[#0f0f0f]/95 backdrop-blur-md
                    border-t border-white/[0.06]
                    flex items-center justify-around
                    pb-safe">
      {filteredItems.map(({ href, icon: Icon, label }) => {
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
