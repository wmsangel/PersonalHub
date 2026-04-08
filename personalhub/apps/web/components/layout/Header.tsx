'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LogOut, Search, Settings, Sparkles, User } from 'lucide-react'
import { signOutAction } from '@/app/actions'
import { NotificationBell } from '@/components/layout/NotificationBell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Панель семьи', subtitle: 'Все договоренности, задачи и заметки под рукой.' },
  '/dashboard/tasks': { title: 'Задачи', subtitle: 'Планируйте, назначайте и закрывайте без хаоса.' },
  '/dashboard/shopping': { title: 'Покупки', subtitle: 'Общий список, который не теряется в переписках.' },
  '/dashboard/notes': { title: 'Заметки', subtitle: 'Личные и общие заметки в одном спокойном пространстве.' },
  '/dashboard/calendar': { title: 'Календарь', subtitle: 'События семьи, дедлайны и ближайшие планы.' },
  '/dashboard/finances': { title: 'Финансы', subtitle: 'Баланс, движение денег и семейная прозрачность.' },
  '/dashboard/wishlists': { title: 'Вишлисты', subtitle: 'Подарки, желания и бронирование без накладок.' },
  '/dashboard/family': { title: 'Семья', subtitle: 'Участники, роли, приглашения и доступы.' },
  '/dashboard/settings/billing': { title: 'Биллинг', subtitle: 'Тариф, платежи и управление подпиской.' },
}

interface HeaderProps {
  userId: string
  userEmail?: string
  userName?: string
  familyName?: string
}

export function Header({ userId, userEmail, userName, familyName }: HeaderProps) {
  const pathname = usePathname()

  const currentPage =
    Object.entries(pageMeta)
      .reverse()
      .find(([path]) => pathname.startsWith(path))?.[1] ?? {
      title: 'PersonalHub',
      subtitle: 'Единое пространство для семьи.',
    }

  const initials = userName
    ? userName
        .split(' ')
        .map((value) => value[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() ?? 'PH'

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-[#090b11]/72 backdrop-blur-2xl">
      <div className="page-shell flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/14 bg-cyan-400/7 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-100/72">
              <Sparkles className="h-3.5 w-3.5" />
              PersonalHub
            </span>
            {familyName ? (
              <span className="hidden rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/42 sm:inline-flex">
                {familyName}
              </span>
            ) : null}
          </div>

          <h1 className="truncate text-[1.55rem] font-semibold tracking-[-0.03em] text-white">
            {currentPage.title}
          </h1>
          <p className="mt-1 hidden text-sm text-white/42 md:block">{currentPage.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/42 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.06] hover:text-white/70 lg:inline-flex"
          >
            <Search className="h-4 w-4" />
            Поиск скоро
          </button>

          <NotificationBell userId={userId} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.06]">
                <Avatar className="h-9 w-9 border border-white/8">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-xs font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden max-w-[170px] text-left sm:block">
                  <p className="truncate text-sm font-medium text-white">{userName || 'Пользователь'}</p>
                  <p className="truncate text-xs text-white/38">{userEmail}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-white/35" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60 rounded-2xl border-white/10 bg-[#12141b]/96 p-1.5 backdrop-blur-xl">
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-medium text-white">{userName || 'Пользователь'}</p>
                <p className="truncate text-xs text-white/42">{userEmail}</p>
              </div>
              <DropdownMenuSeparator className="bg-white/8" />
              <DropdownMenuItem className="gap-2 rounded-xl text-white/72 hover:text-white focus:text-white">
                <User className="h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2 rounded-xl text-white/72 hover:text-white focus:text-white">
                <Link href="/dashboard/settings/billing">
                  <Settings className="h-4 w-4" />
                  Настройки и тариф
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/8" />
              <DropdownMenuItem
                className="gap-2 rounded-xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 focus:bg-rose-500/10 focus:text-rose-200"
                onClick={() => signOutAction()}
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
