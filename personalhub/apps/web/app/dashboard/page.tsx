import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CalendarDays, CheckSquare, FileText, ShoppingCart, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const initials = (value: string): string =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'PH'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 17) return 'Добрый день'
  return 'Добрый вечер'
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  let { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    const fullName = profile?.full_name?.trim() || user.user_metadata?.full_name || 'Моё пространство'

    await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: fullName,
        locale: 'ru',
      },
      { onConflict: 'id' },
    )

    const { data: newFamily, error: familyError } = await supabase
      .from('families')
      .insert({
        name: `${fullName} пространство`,
        created_by: user.id,
        plan: 'free',
      })
      .select('id')
      .single()

    if (!familyError && newFamily?.id) {
      const { error: memberError } = await supabase.from('family_members').insert({
        family_id: newFamily.id,
        user_id: user.id,
        role: 'admin',
        nickname: null,
        is_active: true,
      })

      if (!memberError) {
        membership = { family_id: newFamily.id }
      }
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? null
  const greeting = getGreeting()
  const formattedDate = getFormattedDate()

  if (!membership) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/28 capitalize">{formattedDate}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h2>
          <p className="mt-0.5 text-sm text-white/45">Подготовим ваше семейное пространство</p>
        </div>

        <Card className="surface-panel-soft relative overflow-hidden p-8 sm:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <div className="flex max-w-2xl flex-col gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Первый запуск</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">Создадим пространство за один шаг</h3>
              <p className="mt-2 text-sm leading-7 text-white/50">
                Мы почти закончили настройку. Перейдите в раздел семьи, чтобы проверить участников и приглашения.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard/family">
                  Открыть раздел семьи
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const familyId = membership.family_id

  const shoppingListsResult = await supabase
    .from('shopping_lists')
    .select('id')
    .eq('family_id', familyId)
    .eq('is_active', true)

  const shoppingListIds = shoppingListsResult.data?.map((list) => list.id) ?? []

  const [
    tasksCountResult,
    tasksRecentResult,
    shoppingUncheckedResult,
    shoppingRecentResult,
    notesCountResult,
    notesRecentResult,
    eventsCountResult,
    membersResult,
  ] = await Promise.all([
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('family_id', familyId).neq('status', 'done'),
    supabase
      .from('tasks')
      .select('id, title, status')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(3),
    shoppingListIds.length === 0
      ? Promise.resolve({ count: 0 })
      : supabase
          .from('shopping_items')
          .select('id', { count: 'exact', head: true })
          .in('list_id', shoppingListIds)
          .eq('is_checked', false),
    shoppingListIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ id: string; title: string }> })
      : supabase
          .from('shopping_items')
          .select('id, title')
          .in('list_id', shoppingListIds)
          .eq('is_checked', false)
          .order('created_at', { ascending: false })
          .limit(3),
    supabase.from('notes').select('id', { count: 'exact', head: true }).eq('family_id', familyId),
    supabase.from('notes').select('id, title').eq('family_id', familyId).order('updated_at', { ascending: false }).limit(3),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', familyId)
      .gte('starts_at', new Date().toISOString()),
    supabase
      .from('family_members')
      .select('id, role, nickname, profiles(full_name)')
      .eq('family_id', familyId)
      .eq('is_active', true),
  ])

  const tasksActiveCount = tasksCountResult.count ?? 0
  const tasksRecent = tasksRecentResult.data ?? []
  const shoppingUnchecked = shoppingUncheckedResult.count ?? 0
  const shoppingRecent = shoppingRecentResult.data ?? []
  const notesCount = notesCountResult.count ?? 0
  const notesRecent = notesRecentResult.data ?? []
  const eventsCount = eventsCountResult.count ?? 0
  const members = membersResult.data ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/28 capitalize">{formattedDate}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h2>
        <p className="mt-0.5 text-sm text-white/45">Обзор вашего семейного пространства</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Tasks */}
        <Card className="surface-panel-soft group relative overflow-hidden transition-all hover:shadow-[0_14px_38px_rgba(0,0,0,0.22)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <div className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Задачи</p>
                <p className="mt-1.5 text-4xl font-bold tabular-nums leading-none text-white">{tasksActiveCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 transition-all group-hover:border-indigo-500/30 group-hover:bg-indigo-500/[0.15]">
                <CheckSquare className="h-[18px] w-[18px] text-indigo-300" />
              </div>
            </div>

            <div className="space-y-1">
              {tasksRecent.length === 0 ? (
                <p className="py-1 text-sm text-white/28">Нет активных задач</p>
              ) : (
                tasksRecent.map((task) => (
                  <div key={task.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/[0.03]">
                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${task.status === 'done' ? 'bg-emerald-400/60' : 'bg-indigo-400/50'}`} />
                    <span className="truncate text-sm text-white/60">{task.title}</span>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/dashboard/tasks"
              className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[13px] text-white/38 transition-colors hover:text-white/65"
            >
              <span>Перейти к задачам</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Shopping */}
        <Card className="surface-panel-soft group relative overflow-hidden transition-all hover:shadow-[0_14px_38px_rgba(0,0,0,0.22)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Покупки</p>
                <p className="mt-1.5 text-4xl font-bold tabular-nums leading-none text-white">{shoppingUnchecked}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 transition-all group-hover:border-emerald-500/30 group-hover:bg-emerald-500/[0.15]">
                <ShoppingCart className="h-[18px] w-[18px] text-emerald-300" />
              </div>
            </div>

            <div className="space-y-1">
              {shoppingRecent.length === 0 ? (
                <p className="py-1 text-sm text-white/28">Список покупок пока пуст</p>
              ) : (
                shoppingRecent.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/[0.03]">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/50" />
                    <span className="truncate text-sm text-white/60">{item.title}</span>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/dashboard/shopping"
              className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[13px] text-white/38 transition-colors hover:text-white/65"
            >
              <span>Перейти к покупкам</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Notes */}
        <Card className="surface-panel-soft group relative overflow-hidden transition-all hover:shadow-[0_14px_38px_rgba(0,0,0,0.22)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Заметки</p>
                <p className="mt-1.5 text-4xl font-bold tabular-nums leading-none text-white">{notesCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 transition-all group-hover:border-amber-500/30 group-hover:bg-amber-500/[0.15]">
                <FileText className="h-[18px] w-[18px] text-amber-300" />
              </div>
            </div>

            <div className="space-y-1">
              {notesRecent.length === 0 ? (
                <p className="py-1 text-sm text-white/28">Заметок пока нет</p>
              ) : (
                notesRecent.map((note) => (
                  <div key={note.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/[0.03]">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/50" />
                    <span className="truncate text-sm text-white/60">{note.title}</span>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/dashboard/notes"
              className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[13px] text-white/38 transition-colors hover:text-white/65"
            >
              <span>Перейти к заметкам</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Calendar */}
        <Card className="surface-panel-soft group relative overflow-hidden transition-all hover:shadow-[0_14px_38px_rgba(0,0,0,0.22)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
          <div className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Календарь</p>
                <p className="mt-1.5 text-4xl font-bold tabular-nums leading-none text-white">{eventsCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 transition-all group-hover:border-violet-500/30 group-hover:bg-violet-500/[0.15]">
                <CalendarDays className="h-[18px] w-[18px] text-violet-300" />
              </div>
            </div>

            <p className="py-1 text-sm leading-6 text-white/42">
              {eventsCount === 0
                ? 'Нет предстоящих событий'
                : `${eventsCount} предстоящ${eventsCount === 1 ? 'ее событие' : eventsCount < 5 ? 'их события' : 'их событий'}`}
            </p>

            <Link
              href="/dashboard/calendar"
              className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[13px] text-white/38 transition-colors hover:text-white/65"
            >
              <span>Перейти к календарю</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Members */}
        <Card className="surface-panel-soft group relative overflow-hidden transition-all hover:shadow-[0_14px_38px_rgba(0,0,0,0.22)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />
          <div className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Участники</p>
                <p className="mt-1.5 text-4xl font-bold tabular-nums leading-none text-white">{members.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 transition-all group-hover:border-rose-500/30 group-hover:bg-rose-500/[0.15]">
                <Users className="h-[18px] w-[18px] text-rose-300" />
              </div>
            </div>

            <div className="space-y-1">
              {members.length === 0 ? (
                <p className="py-1 text-sm text-white/28">Участников пока нет</p>
              ) : (
                members.slice(0, 3).map((member) => {
                  const memberProfile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
                  const name = member.nickname || memberProfile?.full_name || 'Участник'

                  return (
                    <div key={member.id} className="flex items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/[0.03]">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/25 to-cyan-400/12 text-[10px] font-semibold text-white/80">
                        {initials(name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white/60">{name}</p>
                      </div>
                      <p className="ml-auto shrink-0 text-xs capitalize text-white/30">{member.role}</p>
                    </div>
                  )
                })
              )}
            </div>

            <Link
              href="/dashboard/family"
              className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[13px] text-white/38 transition-colors hover:text-white/65"
            >
              <span>Перейти к семье</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
