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

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('id, family_id, role, families(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!familyMember) {
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
      const familyTitle = `${fullName} пространство`
      const { data: createdFamily, error: createdFamilyError } = await supabase
        .from('families')
        .insert({
          name: familyTitle,
          created_by: user.id,
          plan: 'free',
        })
        .select('id')
        .single()

      if (!createdFamilyError && createdFamily) {
        const { error: membershipInsertError } = await supabase.from('family_members').insert({
          family_id: createdFamily.id,
          user_id: user.id,
          role: 'admin',
          nickname: fullName,
          is_active: true,
        })

        if (!membershipInsertError) {
          redirect('/dashboard')
        }
      }
    }
  }

  const familyName = (familyMember?.families as { name?: string } | null)?.name
  const modulePermissions = Object.fromEntries(
    MODULE_KEYS.map((key) => [key, familyMember?.role === 'admin'])
  ) as Record<(typeof MODULE_KEYS)[number], boolean>

  if (familyMember && familyMember.role !== 'admin') {
    const { data: permissions } = await supabase
      .from('member_permissions')
      .select('module, can_view')
      .eq('member_id', familyMember.id)

    for (const permission of permissions ?? []) {
      if (permission.module in modulePermissions) {
        modulePermissions[permission.module as (typeof MODULE_KEYS)[number]] = Boolean(permission.can_view)
      }
    }
  }

  const visibleModules = familyMember ? MODULE_KEYS.filter((key) => modulePermissions[key]) : [...MODULE_KEYS]

  return (
    <div className="min-h-screen">
      <Sidebar visibleModules={visibleModules} />

      <div className="flex min-h-screen flex-col pb-24 md:ml-[292px] md:pb-0 xl:ml-[304px]">
        <Header
          userId={user.id}
          userEmail={user.email}
          userName={profile?.full_name ?? undefined}
          familyName={familyName}
        />

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="page-shell">
            {children}
          </div>
        </main>
      </div>

      <MobileNav visibleModules={visibleModules} />
    </div>
  )
}
