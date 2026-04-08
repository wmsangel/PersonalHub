'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, CheckSquare, FileText, House, ShoppingCart, Users, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { href: '/dashboard', icon: House, label: 'Домой', module: null },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'Задачи', module: 'tasks' },
  { href: '/dashboard/shopping', icon: ShoppingCart, label: 'Покупки', module: 'shopping' },
  { href: '/dashboard/notes', icon: FileText, label: 'Заметки', module: 'notes' },
  { href: '/dashboard/calendar', icon: CalendarDays, label: 'План', module: 'calendar' },
  { href: '/dashboard/finances', icon: Wallet, label: 'Деньги', module: 'finances' },
  { href: '/dashboard/family', icon: Users, label: 'Семья', module: null },
] as const

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
    <nav className="fixed inset-x-0 bottom-3 z-30 px-3 md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-1 rounded-[1.6rem] border border-white/10 bg-[#0d1017]/88 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
        {filteredItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-[1rem] px-2 py-2.5 transition-all duration-200',
                isActive ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-white/34'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200',
                  isActive ? 'bg-gradient-to-br from-indigo-500/25 to-cyan-400/12' : 'bg-transparent'
                )}
              >
                <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-white' : 'text-white/40')} />
              </div>
              <span className={cn('max-w-full truncate text-[10px] font-medium', isActive ? 'text-white/88' : 'text-white/34')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
