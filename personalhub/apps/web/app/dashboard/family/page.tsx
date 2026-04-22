import { redirect } from "next/navigation";
import { Sparkles, Users } from "lucide-react";
import { ActionToast } from "@/components/providers/ActionToast";
import {
  completeOnboardingAction,
  inviteMemberAction,
  revokeInviteAction,
  updateFamilyMemberRoleAction,
  updateFamilySettingsAction,
} from "@/app/actions";
import { INVITED_PROFILE_PLACEHOLDER } from "@/app/constants";
import { PermissionsDialog } from "@/components/family/PermissionsDialog";
import { expirePendingInvites } from "@/lib/invites";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type MemberRow = {
  id: string;
  user_id: string;
  role: "admin" | "adult" | "child" | "guest";
  nickname: string | null;
  color: string | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

type InviteRow = {
  id: string;
  invited_email: string;
  role: "admin" | "adult" | "child" | "guest";
  nickname: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  created_at: string;
};

type MemberPermissionRow = {
  member_id: string;
  module: "calendar" | "tasks" | "notes" | "finances" | "wishlists" | "shopping" | "documents";
  can_view: boolean;
  can_edit: boolean;
};

const INVITE_STATUSES = ["pending", "accepted", "revoked", "expired", "all"] as const;
type InviteStatusFilter = (typeof INVITE_STATUSES)[number];
const INVITE_SORTS = [
  "created_desc",
  "created_asc",
  "email_asc",
  "email_desc",
  "status_asc",
  "status_desc",
] as const;
type InviteSort = (typeof INVITE_SORTS)[number];

const INVITES_PAGE_SIZE = 8;

const readParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const parsePage = (raw: string): number => {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
};

const isValidInviteStatus = (value: string): value is InviteStatusFilter =>
  (INVITE_STATUSES as readonly string[]).includes(value);

const isValidInviteSort = (value: string): value is InviteSort =>
  (INVITE_SORTS as readonly string[]).includes(value);

const readFullName = (profiles: MemberRow["profiles"]): string => {
  if (!profiles) {
    return "Unknown";
  }

  if (Array.isArray(profiles)) {
    return profiles[0]?.full_name ?? "Unknown";
  }

  return profiles.full_name ?? "Unknown";
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

const getRoleLabel = (role: string): string => {
  if (role === "admin") return "Администратор";
  if (role === "adult") return "Взрослый";
  if (role === "child") return "Ребёнок";
  if (role === "guest") return "Гость";
  return role;
};

const getStatusLabel = (status: string): string => {
  if (status === "pending") return "Ожидает";
  if (status === "accepted") return "Принято";
  if (status === "revoked") return "Отозвано";
  if (status === "expired") return "Истекло";
  return status;
};

const statusClass = (status: string): string => {
  if (status === "pending") return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  if (status === "accepted") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "revoked") return "border-rose-500/20 bg-rose-500/10 text-rose-300";
  return "border-white/10 bg-white/[0.04] text-white/40";
};
const getInitials = (value: string): string =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "PH";

export default async function FamilyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = readParam(params.status);
  const message = readParam(params.message);

  const inviteQuery = readParam(params.invite_q).trim().toLowerCase();
  const inviteStatusRaw = readParam(params.invite_status);
  const inviteStatus: InviteStatusFilter = isValidInviteStatus(inviteStatusRaw) ? inviteStatusRaw : "pending";
  const inviteSortRaw = readParam(params.invite_sort);
  const inviteSort: InviteSort = isValidInviteSort(inviteSortRaw) ? inviteSortRaw : "created_desc";
  const invitePageRequested = parsePage(readParam(params.invite_page));

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const profileResult = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileResult.data ?? null;

  const memberResult = await supabase
    .from("family_members")
    .select("id, family_id, role, nickname")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const membership = memberResult.data?.[0] ?? null;

  if (membership && (!profile || profile.full_name === INVITED_PROFILE_PLACEHOLDER)) {
    redirect("/invite/accept");
  }

  if (membership) {
    const expireError = await expirePendingInvites(membership.family_id);
    if (expireError) {
      redirect(`/dashboard/family?status=error&message=${encodeURIComponent(expireError)}`);
    }
  }

  const familyResult = membership
    ? await supabase.from("families").select("id, name, plan").eq("id", membership.family_id).maybeSingle()
    : null;

  const family = familyResult?.data ?? null;

  const membersResult = membership
    ? await supabase
        .from("family_members")
        .select("id, user_id, role, nickname, color, profiles(full_name)")
        .eq("family_id", membership.family_id)
        .eq("is_active", true)
    : null;

  const members = (membersResult?.data as MemberRow[] | undefined) ?? [];
  const memberPermissionsResult = membership
    ? await supabase
        .from("member_permissions")
        .select("member_id, module, can_view, can_edit")
        .eq("family_id", membership.family_id)
    : null;
  const memberPermissions = (memberPermissionsResult?.data as MemberPermissionRow[] | undefined) ?? [];
  const memberPermissionsMap = memberPermissions.reduce<Record<string, MemberPermissionRow[]>>((acc, permission) => {
    const permissionsForMember = acc[permission.member_id] ?? [];
    permissionsForMember.push(permission);
    acc[permission.member_id] = permissionsForMember;
    return acc;
  }, {});

  let invites: InviteRow[] = [];
  let totalInviteCount = 0;
  let invitePage = invitePageRequested;

  if (membership && membership.role === "admin") {
    let query = supabase
      .from("family_invites")
      .select("id, invited_email, role, nickname, status, created_at", { count: "exact" })
      .eq("family_id", membership.family_id);

    if (inviteSort === "created_desc") {
      query = query.order("created_at", { ascending: false });
    } else if (inviteSort === "created_asc") {
      query = query.order("created_at", { ascending: true });
    } else if (inviteSort === "email_asc") {
      query = query.order("invited_email", { ascending: true });
    } else if (inviteSort === "email_desc") {
      query = query.order("invited_email", { ascending: false });
    } else if (inviteSort === "status_asc") {
      query = query.order("status", { ascending: true }).order("created_at", { ascending: false });
    } else {
      query = query.order("status", { ascending: false }).order("created_at", { ascending: false });
    }

    if (inviteStatus !== "all") {
      query = query.eq("status", inviteStatus);
    }

    if (inviteQuery) {
      query = query.ilike("invited_email", `%${inviteQuery}%`);
    }

    const from = (invitePage - 1) * INVITES_PAGE_SIZE;
    const to = from + INVITES_PAGE_SIZE - 1;

    const invitesResult = await query.range(from, to);
    invites = (invitesResult.data as InviteRow[] | null) ?? [];
    totalInviteCount = invitesResult.count ?? 0;

    const maxPage = Math.max(1, Math.ceil(totalInviteCount / INVITES_PAGE_SIZE));
    if (invitePage > maxPage) {
      invitePage = maxPage;
    }
  }

  const maxInvitePage = Math.max(1, Math.ceil(totalInviteCount / INVITES_PAGE_SIZE));

  const buildInviteUrl = (overrides: Record<string, string>): string => {
    const nextParams = new URLSearchParams();

    if (inviteQuery) {
      nextParams.set("invite_q", inviteQuery);
    }

    nextParams.set("invite_status", inviteStatus);
    nextParams.set("invite_sort", inviteSort);
    nextParams.set("invite_page", String(invitePage));

    Object.entries(overrides).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    return `/dashboard/family?${nextParams.toString()}`;
  };

  return (
    <section className="grid gap-6">
      <ActionToast status={status} message={message} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-rose-500/18 bg-rose-500/10">
            <Users className="h-6 w-6 text-rose-300" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/34">
              <Sparkles className="h-3.5 w-3.5 text-rose-300" />
              состав и доступ
            </div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">Семья</h1>
            <p className="mt-1 text-sm text-white/42">Участники, приглашения и настройки семейного пространства.</p>
          </div>
        </div>
      </header>

      {!family || !membership ? (
        <div className="mx-auto max-w-xl px-4 py-14">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/20 to-pink-600/20">
                <Users className="h-9 w-9 text-rose-400" />
              </div>
              <div className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-rose-500/40" />
              <div className="absolute -bottom-1.5 -left-1.5 h-2.5 w-2.5 rounded-full bg-pink-500/40" />
            </div>
          </div>

          <div className="mb-10 text-center">
            <h2 className="mb-3 text-[2rem] font-semibold tracking-[-0.04em] text-white">Создайте семейное пространство</h2>
            <p className="mx-auto max-w-md text-sm leading-7 text-white/42">
              Добавьте информацию о себе и вашей семье. Вы станете администратором и сможете пригласить остальных.
            </p>
          </div>

          <form action={completeOnboardingAction} className="surface-panel space-y-5 rounded-[1.6rem] p-6">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">Ваше имя</label>
              <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Иван Иванов" required className="field-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">Название семьи</label>
              <input name="family_name" placeholder="Семья Ивановых" required className="field-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
                Никнейм <span className="text-white/20">(необязательно)</span>
              </label>
              <input name="nickname" placeholder="Папа, Мама..." className="field-input" />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(244,63,94,0.25)] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_28px_rgba(244,63,94,0.35)]"
            >
              Создать семейное пространство →
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/20">После создания вы сможете пригласить остальных участников семьи</p>
        </div>
      ) : (
        <>
          {/* Members */}
          <Card className="grid gap-5 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-white">Участники</h2>
              <p className="mt-0.5 text-sm text-white/40">Все активные участники и их текущие роли.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => {
                const memberName = member.nickname || readFullName(member.profiles);
                return (
                  <article
                    key={member.id}
                    className="surface-panel-soft rounded-[1.3rem] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.05]"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-600/20 text-sm font-semibold text-white">
                          {getInitials(memberName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{memberName}</p>
                        {member.nickname ? <p className="truncate text-xs text-white/38">{readFullName(member.profiles)}</p> : null}
                        <span className="mt-1.5 inline-flex rounded-lg border border-white/[0.1] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white/45">
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                    </div>

                    {membership.role === "admin" ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                        <form action={updateFamilyMemberRoleAction} className="flex flex-1 items-center gap-2">
                          <input type="hidden" name="member_id" value={member.id} />
                          <select name="role" defaultValue={member.role} className="field-input flex-1">
                            <option value="admin">Администратор</option>
                            <option value="adult">Взрослый</option>
                            <option value="child">Ребёнок</option>
                            <option value="guest">Гость</option>
                          </select>
                          <Button size="sm" type="submit" variant="outline">
                            Сохранить
                          </Button>
                        </form>
                        <PermissionsDialog
                          memberId={member.id}
                          memberDisplayName={memberName}
                          memberRole={member.role}
                          initialPermissions={memberPermissionsMap[member.id] ?? []}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </Card>

          {/* Family settings */}
          {membership.role === "admin" ? (
            <Card className="grid gap-5 p-5 sm:p-6">
              <div>
                <h2 className="text-base font-semibold text-white">Настройки пространства</h2>
                <p className="mt-0.5 text-sm text-white/40">Название и тарифный план семьи.</p>
              </div>
              <form action={updateFamilySettingsAction} className="grid gap-4 sm:grid-cols-[1fr_auto_auto] items-end">
                <input type="hidden" name="family_id" value={family?.id ?? ""} />
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-white/38">Название</label>
                  <input name="family_name" defaultValue={family?.name ?? ""} className="field-input" placeholder="Семья Ивановых" required />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-white/38">Тариф</label>
                  <select name="plan" defaultValue={family?.plan ?? "free"} className="field-input">
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="family_plus">Family+</option>
                  </select>
                </div>
                <Button type="submit">Сохранить</Button>
              </form>
            </Card>
          ) : null}

          {/* Invite form + list */}
          {membership.role === "admin" ? (
            <>
              <Card className="grid gap-5 p-5 sm:p-6">
                <div>
                  <h2 className="text-base font-semibold text-white">Пригласить участника</h2>
                  <p className="mt-0.5 text-sm text-white/40">Участник получит письмо с ссылкой для входа.</p>
                </div>
                <form action={inviteMemberAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] items-end">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-white/38">Email</label>
                    <input name="email" type="email" placeholder="member@example.com" required className="field-input" />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-white/38">
                      Никнейм <span className="text-white/20 normal-case tracking-normal">(необязательно)</span>
                    </label>
                    <input name="nickname" type="text" placeholder="Папа, Мама..." className="field-input" />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-white/38">Роль</label>
                    <select name="role" defaultValue="child" className="field-input">
                      <option value="adult">Взрослый</option>
                      <option value="child">Ребёнок</option>
                      <option value="guest">Гость</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                  <Button type="submit">Пригласить</Button>
                </form>
              </Card>

              <Card className="grid gap-5 p-5 sm:p-6">
                <div>
                  <h2 className="text-base font-semibold text-white">Список приглашений</h2>
                  <p className="mt-0.5 text-sm text-white/40">Управляйте отправленными приглашениями.</p>
                </div>

                <form action="/dashboard/family" method="get" className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] items-end">
                  <input name="invite_q" placeholder="Поиск по email..." defaultValue={inviteQuery} className="field-input" />
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-white/38">Статус</label>
                    <select name="invite_status" defaultValue={inviteStatus} className="field-input">
                      <option value="pending">Ожидает</option>
                      <option value="accepted">Принято</option>
                      <option value="revoked">Отозвано</option>
                      <option value="expired">Истекло</option>
                      <option value="all">Все статусы</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-white/38">Сортировка</label>
                    <select name="invite_sort" defaultValue={inviteSort} className="field-input">
                      <option value="created_desc">Новые первые</option>
                      <option value="created_asc">Старые первые</option>
                      <option value="email_asc">Email: А–Я</option>
                      <option value="email_desc">Email: Я–А</option>
                      <option value="status_asc">Статус: А–Я</option>
                      <option value="status_desc">Статус: Я–А</option>
                    </select>
                  </div>
                  <Button type="submit" variant="outline">Применить</Button>
                </form>

                {invites.length === 0 ? (
                  <p className="py-4 text-center text-sm text-white/35">Приглашений не найдено</p>
                ) : (
                  <ul className="grid gap-2">
                    {invites.map((invite) => (
                      <li key={invite.id} className="surface-panel-soft flex items-center gap-3 rounded-[1.2rem] p-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-xs font-semibold text-white/55">
                          {invite.invited_email[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white/80">{invite.invited_email}</p>
                          <p className="mt-0.5 text-xs text-white/35">
                            {invite.nickname ? `${invite.nickname} · ` : ""}
                            {getRoleLabel(invite.role)} · {formatDate(invite.created_at)}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[11px] uppercase tracking-[0.14em] ${statusClass(invite.status)}`}>
                          {getStatusLabel(invite.status)}
                        </span>
                        {invite.status === "pending" ? (
                          <form action={revokeInviteAction}>
                            <input type="hidden" name="invite_id" value={invite.id} />
                            <Button size="sm" variant="outline" type="submit">
                              Отозвать
                            </Button>
                          </form>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}

                {maxInvitePage > 1 ? (
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <a
                      href={buildInviteUrl({ invite_page: String(Math.max(1, invitePage - 1)) })}
                      className={`rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/55 transition-all hover:border-white/[0.12] hover:text-white/80 ${invitePage <= 1 ? "pointer-events-none opacity-35" : ""}`}
                    >
                      ← Назад
                    </a>
                    <span className="text-xs text-white/35">
                      Страница {invitePage} из {maxInvitePage}
                    </span>
                    <a
                      href={buildInviteUrl({ invite_page: String(Math.min(maxInvitePage, invitePage + 1)) })}
                      className={`rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/55 transition-all hover:border-white/[0.12] hover:text-white/80 ${invitePage >= maxInvitePage ? "pointer-events-none opacity-35" : ""}`}
                    >
                      Вперёд →
                    </a>
                  </div>
                ) : null}
              </Card>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
