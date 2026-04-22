import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const MODULE_KEYS = ['tasks', 'shopping', 'notes', 'calendar', 'finances', 'wishlists', 'documents'] as const

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    .select('id, family_id, role, families(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) {
    const profileName = profile?.full_name?.trim()
    const metadataName =
      typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : ''
    const emailName = user.email?.split('@')[0] ?? 'Моя семья'
    const fullName = profileName || metadataName || emailName || 'Пользователь'

    const { error: upsertProfileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: fullName,
        locale: 'ru',
      },
      { onConflict: 'id' },
    )

    if (!upsertProfileError) {
      const { data: createdFamily, error: familyCreateError } = await supabase
        .from('families')
        .insert({
          name: `${fullName} пространство`,
          created_by: user.id,
          plan: 'free',
        })
        .select('id')
        .single()

      if (!familyCreateError && createdFamily) {
        const { error: memberCreateError } = await supabase.from('family_members').insert({
          family_id: createdFamily.id,
          user_id: user.id,
          role: 'admin',
          nickname: fullName,
          is_active: true,
        })

        if (!memberCreateError) {
          membership = {
            id: user.id,
            family_id: createdFamily.id,
            role: 'admin',
            families: [{ name: `${fullName} пространство` }],
          }
        }
      }
    }
  }

  const familyRelation = membership?.families as { name?: string } | { name?: string }[] | null | undefined
  const familyName = Array.isArray(familyRelation) ? familyRelation[0]?.name : familyRelation?.name

  const modulePermissions = Object.fromEntries(
    MODULE_KEYS.map((key) => [key, membership?.role === 'admin']),
  ) as Record<(typeof MODULE_KEYS)[number], boolean>

  if (membership?.id && membership.role !== 'admin') {
    const { data: permissions } = await supabase
      .from('member_permissions')
      .select('module, can_view')
      .eq('member_id', membership.id)
      .eq('can_view', true)

    for (const permission of permissions ?? []) {
      if (permission.module in modulePermissions) {
        modulePermissions[permission.module as (typeof MODULE_KEYS)[number]] = true
      }
    }
  }

  const visibleModules =
    membership && membership.role !== 'admin'
      ? MODULE_KEYS.filter((key) => modulePermissions[key])
      : [...MODULE_KEYS]

  return (
    <div className="relative min-h-screen">
      <Sidebar visibleModules={visibleModules} />

      <div className="min-h-screen md:ml-[292px] xl:ml-[304px]">
        <Header
          userId={user.id}
          userEmail={user.email}
          userName={profile?.full_name ?? undefined}
          familyName={familyName}
        />

        <main className="page-shell px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8 lg:px-10 lg:py-10 md:pb-10">
          {children}
        </main>
      </div>

      <MobileNav visibleModules={visibleModules} />
    </div>
  )
}
