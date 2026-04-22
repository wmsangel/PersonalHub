'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { signOutAction } from '@/app/actions'
import { NotificationBell } from '@/components/layout/NotificationBell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Обзор',
  '/dashboard/tasks': 'Задачи',
  '/dashboard/shopping': 'Список покупок',
  '/dashboard/notes': 'Заметки',
  '/dashboard/calendar': 'Календарь',
  '/dashboard/finances': 'Финансы',
  '/dashboard/wishlists': 'Вишлисты',
  '/dashboard/family': 'Семья',
  '/dashboard/settings/billing': 'Биллинг',
}

interface HeaderProps {
  userId: string
  userEmail?: string
  userName?: string
  familyName?: string
}

export function Header({ userId, userEmail, userName, familyName }: HeaderProps) {
  const pathname = usePathname()

  const title =
    Object.entries(pageTitles)
      .reverse()
      .find(([path]) => pathname.startsWith(path))?.[1] ?? 'PersonalHub'

  const initials = userName
    ? userName
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-white/[0.07] bg-[#090b11]/92 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-[15px] font-semibold leading-none tracking-tight text-white">{title}</h1>
          {familyName ? <p className="mt-1.5 text-[11px] leading-none text-white/32">{familyName}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <NotificationBell userId={userId} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 transition-all hover:border-white/[0.11] hover:bg-white/[0.055] focus:outline-none">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-semibold text-white shadow-md">
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-[120px] truncate text-xs font-medium leading-none text-white/90">
                  {userName || 'Пользователь'}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-white/25" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-medium text-white">{userName || 'Пользователь'}</p>
              <p className="mt-0.5 truncate text-xs text-white/38">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2">
              <User className="h-4 w-4" /> Профиль
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <Link href="/dashboard/settings/billing">
                <Settings className="h-4 w-4" /> Настройки
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-rose-400 focus:text-rose-300"
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
