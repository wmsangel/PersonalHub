import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  FileText,
  Home,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const initials = (value: string): string =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "PH";

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const membershipResult = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const membership = membershipResult.data;

  if (!membership) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: profile?.full_name?.trim() || user.user_metadata?.full_name || "Моё пространство",
        locale: "ru",
      },
      { onConflict: "id" },
    );

    const { data: newFamily, error: familyError } = await supabase
      .from("families")
      .insert({
        name: `${profile?.full_name?.trim() || "Моё"} пространство`,
        created_by: user.id,
        plan: "free",
      })
      .select("id")
      .single();

    if (!familyError && newFamily?.id) {
      const { error: memberError } = await supabase.from("family_members").insert({
        family_id: newFamily.id,
        user_id: user.id,
        role: "admin",
        nickname: null,
        is_active: true,
      });

      if (!memberError) {
        redirect("/dashboard");
      }
    }

    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-indigo-500/10 bg-gradient-to-br from-indigo-500/10 to-violet-600/10">
            <Home className="h-11 w-11 text-indigo-400/60" />
          </div>
          <div className="absolute -right-2 -top-2 h-3 w-3 animate-pulse rounded-full bg-indigo-500/40" />
          <div
            className="absolute -bottom-2 -left-2 h-2.5 w-2.5 animate-pulse rounded-full bg-violet-500/40"
            style={{ animationDelay: "0.5s" }}
          />
        </div>

        <h2 className="mb-3 text-2xl font-semibold text-white">Добро пожаловать в PersonalHub</h2>
        <p className="mb-10 max-w-md text-sm leading-relaxed text-white/40">
          Чтобы начать, создайте семейное пространство. Затем пригласите близких и начните управлять жизнью вместе.
        </p>

        <div className="mb-10 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20">
              <span className="text-xs font-semibold text-indigo-400">1</span>
            </div>
            <span className="text-xs text-white/30">Создать семью</span>
          </div>
          <div className="h-px w-10 bg-white/10" />
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <span className="text-xs font-semibold text-white/30">2</span>
            </div>
            <span className="text-xs text-white/30">Пригласить близких</span>
          </div>
          <div className="h-px w-10 bg-white/10" />
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <span className="text-xs font-semibold text-white/30">3</span>
            </div>
            <span className="text-xs text-white/30">Начать работу</span>
          </div>
        </div>

        <Link
          href="/dashboard/family"
          className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.25)] transition-all duration-150 hover:-translate-y-px hover:from-indigo-400 hover:to-violet-500 hover:shadow-[0_4px_28px_rgba(99,102,241,0.35)]"
        >
          <Users className="h-4 w-4" />
          Создать семейное пространство
        </Link>

        <p className="mt-6 text-xs text-white/20">Вы станете администратором и сможете управлять доступом</p>
      </div>
    );
  }

  const familyId = membership.family_id;

  const [tasksCountResult, tasksRecentResult, shoppingUncheckedResult, shoppingRecentResult, notesCountResult, notesRecentResult, eventsCountResult, membersResult] =
    await Promise.all([
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("family_id", familyId).neq("status", "done"),
      supabase
        .from("tasks")
        .select("id, title, status")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("shopping_items")
        .select("id", { count: "exact", head: true })
        .in(
          "list_id",
          (
            await supabase
              .from("shopping_lists")
              .select("id")
              .eq("family_id", familyId)
              .eq("is_active", true)
          ).data?.map((list) => list.id) ?? [],
        )
        .eq("is_checked", false),
      supabase
        .from("shopping_items")
        .select("id, title")
        .in(
          "list_id",
          (
            await supabase
              .from("shopping_lists")
              .select("id")
              .eq("family_id", familyId)
              .eq("is_active", true)
          ).data?.map((list) => list.id) ?? [],
        )
        .eq("is_checked", false)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase.from("notes").select("id", { count: "exact", head: true }).eq("family_id", familyId),
      supabase
        .from("notes")
        .select("id, title")
        .eq("family_id", familyId)
        .order("updated_at", { ascending: false })
        .limit(3),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("family_id", familyId)
        .gte("starts_at", new Date().toISOString()),
      supabase
        .from("family_members")
        .select("id, role, nickname, profiles(full_name)")
        .eq("family_id", familyId)
        .eq("is_active", true),
    ]);

  const tasksActiveCount = tasksCountResult.count ?? 0;
  const tasksRecent = tasksRecentResult.data ?? [];
  const shoppingUnchecked = shoppingUncheckedResult.count ?? 0;
  const shoppingRecent = shoppingRecentResult.data ?? [];
  const notesCount = notesCountResult.count ?? 0;
  const notesRecent = notesRecentResult.data ?? [];
  const eventsCount = eventsCountResult.count ?? 0;
  const members = membersResult.data ?? [];

  return (
    <section className="grid gap-8">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_30%)]" />
          <div className="relative">
            <span className="mb-4 inline-flex items-center rounded-full border border-cyan-400/14 bg-cyan-400/7 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-cyan-100/64">
              Семейный обзор
            </span>
            <h1 className="page-title-display max-w-[720px] text-[2.9rem] leading-[0.96] text-white sm:text-[3.5rem]">
              Всё важное
              <br />
              <span className="text-white/56">в одном спокойном ритме</span>
            </h1>
            <p className="mt-4 max-w-[560px] text-sm leading-7 text-white/46">
              Контролируйте задачи, покупки, заметки и ближайшие события без перегруженных экранов и лишних действий.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Активные задачи', value: tasksActiveCount },
                { label: 'Открытые покупки', value: shoppingUnchecked },
                { label: 'Ближайшие события', value: eventsCount },
              ].map((item) => (
                <div key={item.label} className="surface-panel-soft rounded-[1.3rem] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">{item.label}</p>
                  <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.04em] text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Состав</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Семья онлайн</h2>
            </div>
            <Link href="/dashboard/family" className="text-xs text-white/40 transition-colors hover:text-white/72">
              Открыть
            </Link>
          </div>

          <div className="grid gap-3">
            {members.slice(0, 4).map((member) => {
              const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
              const name = member.nickname || profile?.full_name || "Unknown";

              return (
                <div
                  key={member.id}
                  className="surface-panel-soft flex items-center gap-3 rounded-[1.1rem] px-3.5 py-3.5 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.05]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/24 to-cyan-400/12 text-xs font-semibold text-white">
                    {initials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{name}</p>
                    <p className="text-xs capitalize text-white/38">{member.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="group p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/16 bg-indigo-400/10">
                <CheckSquare className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div>
                <h3 className="mb-0.5 text-xs font-medium uppercase tracking-[0.2em] text-white/32">Задачи</h3>
                <p className="text-3xl font-semibold tracking-[-0.04em] text-white">{tasksActiveCount}</p>
              </div>
            </div>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="icon" className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {tasksRecent.length === 0 ? (
              <p className="text-xs text-white/30">Нет активных задач</p>
            ) : (
              tasksRecent.map((task) => (
                <div key={task.id} className="flex items-center gap-2 py-1.5">
                  <div className={`h-2 w-2 rounded-full ${task.status === "done" ? "bg-emerald-400/70" : "bg-indigo-400/70"}`} />
                  <span className="truncate text-xs text-white/70">{task.title}</span>
                </div>
              ))
            )}
          </div>
          <Link
            href="/dashboard/tasks"
            className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-white/40 transition-colors duration-150 hover:text-white/70"
          >
            <span>Смотреть все</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="group p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/16 bg-emerald-400/10">
                <ShoppingCart className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div>
                <h3 className="mb-0.5 text-xs font-medium uppercase tracking-[0.2em] text-white/32">Покупки</h3>
                <p className="text-3xl font-semibold tracking-[-0.04em] text-white">{shoppingUnchecked}</p>
              </div>
            </div>
            <Link href="/dashboard/shopping">
              <Button variant="ghost" size="icon" className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {shoppingRecent.length === 0 ? (
              <p className="text-xs text-white/30">Список пуст</p>
            ) : (
              shoppingRecent.map((item) => (
                <div key={item.id} className="flex items-center gap-2 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400/70" />
                  <span className="truncate text-xs text-white/70">{item.title}</span>
                </div>
              ))
            )}
          </div>
          <Link
            href="/dashboard/shopping"
            className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-white/40 transition-colors duration-150 hover:text-white/70"
          >
            <span>Смотреть все</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="group p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/16 bg-amber-400/10">
                <FileText className="h-4.5 w-4.5 text-amber-400" />
              </div>
              <div>
                <h3 className="mb-0.5 text-xs font-medium uppercase tracking-[0.2em] text-white/32">Заметки</h3>
                <p className="text-3xl font-semibold tracking-[-0.04em] text-white">{notesCount}</p>
              </div>
            </div>
            <Link href="/dashboard/notes">
              <Button variant="ghost" size="icon" className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {notesRecent.length === 0 ? (
              <p className="text-xs text-white/30">Нет заметок</p>
            ) : (
              notesRecent.map((note) => (
                <div key={note.id} className="flex items-center gap-2 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-amber-400/70" />
                  <span className="truncate text-xs text-white/70">{note.title}</span>
                </div>
              ))
            )}
          </div>
          <Link
            href="/dashboard/notes"
            className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-white/40 transition-colors duration-150 hover:text-white/70"
          >
            <span>Смотреть все</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="group p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/16 bg-violet-400/10">
                <CalendarDays className="h-4.5 w-4.5 text-violet-400" />
              </div>
              <div>
                <h3 className="mb-0.5 text-xs font-medium uppercase tracking-[0.2em] text-white/32">Календарь</h3>
                <p className="text-3xl font-semibold tracking-[-0.04em] text-white">{eventsCount}</p>
              </div>
            </div>
            <Link href="/dashboard/calendar">
              <Button variant="ghost" size="icon" className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-white/55">Запланированных событий в будущем</p>
          <Link
            href="/dashboard/calendar"
            className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-white/40 transition-colors duration-150 hover:text-white/70"
          >
            <span>Открыть календарь</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      </div>

    </section>
  );
}
