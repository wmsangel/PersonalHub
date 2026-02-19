import { redirect } from "next/navigation";
import { Users } from "lucide-react";
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

const formatDate = (value: string): string => new Date(value).toLocaleString();
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
    <section className="grid gap-4">
      <ActionToast status={status} message={message} />

      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold">Семья</h1>
        <p className="text-sm text-muted-foreground">Участники, приглашения и настройки семьи.</p>
      </header>

      {!family || !membership ? (
        <div className="mx-auto max-w-lg px-4 py-16">
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
            <h2 className="mb-3 text-2xl font-semibold text-white">Создайте семейное пространство</h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-white/40">
              Добавьте информацию о себе и вашей семье. Вы станете администратором и сможете пригласить остальных.
            </p>
          </div>

          <form action={completeOnboardingAction} className="space-y-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">Ваше имя</label>
              <input
                name="full_name"
                defaultValue={profile?.full_name ?? ""}
                placeholder="Иван Иванов"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.07] focus:border-rose-500/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.08)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">Название семьи</label>
              <input
                name="family_name"
                placeholder="Семья Ивановых"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.07] focus:border-rose-500/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.08)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
                Ваш никнейм <span className="text-white/20">(необязательно)</span>
              </label>
              <input
                name="nickname"
                placeholder="Папа, Мама..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.07] focus:border-rose-500/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.08)]"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(244,63,94,0.25)] transition-all duration-150 hover:-translate-y-px hover:from-rose-400 hover:to-pink-500 hover:shadow-[0_4px_28px_rgba(244,63,94,0.35)]"
            >
              Создать семейное пространство →
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/20">После создания вы сможете пригласить остальных участников семьи</p>
        </div>
      ) : (
        <>
          <Card className="grid gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">Участники</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <article
                  key={member.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-150 hover:border-white/[0.10]"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="bg-indigo-600 text-sm font-semibold text-white">
                        {getInitials(member.nickname || readFullName(member.profiles))}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {member.nickname || readFullName(member.profiles)}
                      </p>
                      <p className="text-xs text-white/40">{readFullName(member.profiles)}</p>
                      <span className="mt-2 inline-flex rounded-md border border-white/[0.12] px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/55">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  {membership.role === "admin" ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                      <form action={updateFamilyMemberRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="member_id" value={member.id} />
                        <select
                          name="role"
                          defaultValue={member.role}
                          className="h-9 rounded-md border border-white/[0.12] bg-[#0f0f11] px-2 text-sm text-white"
                        >
                          <option value="admin">admin</option>
                          <option value="adult">adult</option>
                          <option value="child">child</option>
                          <option value="guest">guest</option>
                        </select>
                        <Button size="sm" type="submit">
                          Изменить
                        </Button>
                      </form>

                      <div className="flex justify-start md:justify-end">
                        <PermissionsDialog
                          memberId={member.id}
                          memberDisplayName={member.nickname || readFullName(member.profiles)}
                          memberRole={member.role}
                          initialPermissions={memberPermissionsMap[member.id] ?? []}
                        />
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </Card>

          {membership.role === "admin" ? (
            <Card className="grid gap-4 p-4">
              <h2 className="text-lg font-semibold">Настройки семьи</h2>
              <form action={updateFamilySettingsAction} className="grid gap-2 md:grid-cols-3">
                <input type="hidden" name="family_id" value={family?.id ?? ""} />
                <input
                  name="family_name"
                  defaultValue={family?.name ?? ""}
                  className="h-10 rounded-md border px-3"
                  placeholder="Название семьи"
                  required
                />
                <select name="plan" defaultValue={family?.plan ?? "free"} className="h-10 rounded-md border px-3">
                  <option value="free">free</option>
                  <option value="premium">premium</option>
                  <option value="family_plus">family_plus</option>
                </select>
                <Button type="submit">Обновить</Button>
              </form>
            </Card>
          ) : null}

          {membership.role === "admin" ? (
            <>
              <Card className="grid gap-3 p-4">
                <h2 className="text-lg font-semibold">Приглашения</h2>
                <form action={inviteMemberAction} className="grid gap-2 md:grid-cols-4">
                  <input name="email" type="email" placeholder="member@email.com" required className="h-10 rounded-md border px-3" />
                  <input name="nickname" type="text" placeholder="Nickname" className="h-10 rounded-md border px-3" />
                  <select name="role" defaultValue="child" className="h-10 rounded-md border px-3">
                    <option value="adult">adult</option>
                    <option value="child">child</option>
                    <option value="guest">guest</option>
                    <option value="admin">admin</option>
                  </select>
                  <Button type="submit">Invite</Button>
                </form>
              </Card>

              <Card className="grid gap-4 p-4">
                <h2 className="text-lg font-semibold">Список приглашений</h2>

                <form action="/dashboard/family" method="get" className="grid gap-2 md:grid-cols-4">
                  <input
                    name="invite_q"
                    placeholder="Search by email"
                    defaultValue={inviteQuery}
                    className="h-10 rounded-md border px-3"
                  />
                  <select name="invite_status" defaultValue={inviteStatus} className="h-10 rounded-md border px-3">
                    <option value="pending">pending</option>
                    <option value="accepted">accepted</option>
                    <option value="revoked">revoked</option>
                    <option value="expired">expired</option>
                    <option value="all">all</option>
                  </select>
                  <select name="invite_sort" defaultValue={inviteSort} className="h-10 rounded-md border px-3">
                    <option value="created_desc">created: newest</option>
                    <option value="created_asc">created: oldest</option>
                    <option value="email_asc">email: A-Z</option>
                    <option value="email_desc">email: Z-A</option>
                    <option value="status_asc">status: A-Z</option>
                    <option value="status_desc">status: Z-A</option>
                  </select>
                  <Button type="submit">Apply</Button>
                </form>

                {invites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invites found.</p>
                ) : (
                  <ul className="grid gap-2">
                    {invites.map((invite) => (
                      <li key={invite.id} className="rounded-md border p-3 text-sm">
                        {invite.invited_email} ({invite.role}){invite.nickname ? ` as ${invite.nickname}` : ""} - {invite.status} at{" "}
                        {formatDate(invite.created_at)}
                        {invite.status === "pending" ? (
                          <form action={revokeInviteAction} className="ml-2 inline">
                            <input type="hidden" name="invite_id" value={invite.id} />
                            <Button size="sm" variant="outline" type="submit">
                              Revoke
                            </Button>
                          </form>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <a
                    href={buildInviteUrl({ invite_page: String(Math.max(1, invitePage - 1)) })}
                    className={invitePage <= 1 ? "pointer-events-none opacity-50" : ""}
                  >
                    Previous
                  </a>
                  <span>
                    Page {invitePage} of {maxInvitePage}
                  </span>
                  <a
                    href={buildInviteUrl({ invite_page: String(Math.min(maxInvitePage, invitePage + 1)) })}
                    className={invitePage >= maxInvitePage ? "pointer-events-none opacity-50" : ""}
                  >
                    Next
                  </a>
                </div>
              </Card>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
