'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Settings, User, ChevronDown } from 'lucide-react'
import { signOutAction } from '@/app/actions'
import { NotificationBell } from '@/components/layout/NotificationBell'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const pageTitles: Record<string, string> = {
  '/dashboard':           'Главная',
  '/dashboard/tasks':     'Задачи',
  '/dashboard/shopping':  'Список покупок',
  '/dashboard/notes':     'Заметки',
  '/dashboard/calendar':  'Календарь',
  '/dashboard/finances':  'Финансы',
  '/dashboard/wishlists': 'Вишлисты',
  '/dashboard/family':    'Семья',
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

  const title = Object.entries(pageTitles)
    .reverse()
    .find(([path]) => pathname.startsWith(path))?.[1] ?? 'PersonalHub'

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="h-14 flex items-center justify-between px-6
                       border-b border-white/[0.06] bg-[#0a0a0a]/80
                       backdrop-blur-sm sticky top-0 z-20">

      <h1 className="text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {familyName && (
          <span className="text-xs text-white/40 hidden sm:block">
            {familyName}
          </span>
        )}
        <NotificationBell userId={userId} />

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
            <DropdownMenuItem asChild className="gap-2 text-white/70 hover:text-white focus:text-white
                                         hover:bg-white/[0.06] focus:bg-white/[0.06] cursor-pointer">
              <Link href="/dashboard/settings/billing">
                <Settings className="h-4 w-4" /> Настройки
              </Link>
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
