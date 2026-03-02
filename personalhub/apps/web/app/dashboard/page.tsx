import Link from "next/link";
import { redirect } from "next/navigation";
import Script from "next/script";
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
    <section className="grid gap-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Главная</h1>
          <p className="mt-1 text-sm text-white/40">Быстрый обзор ключевых модулей семьи.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                <CheckSquare className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div>
                <h3 className="mb-0.5 text-xs font-medium uppercase tracking-wider text-white/40">Задачи</h3>
                <p className="text-2xl font-bold tabular-nums text-white">{tasksActiveCount}</p>
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

        <Card className="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                <ShoppingCart className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div>
                <h3 className="mb-0.5 text-xs font-medium uppercase tracking-wider text-white/40">Покупки</h3>
                <p className="text-2xl font-bold tabular-nums text-white">{shoppingUnchecked}</p>
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

        <Card className="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
                <FileText className="h-4.5 w-4.5 text-amber-400" />
              </div>
              <div>
                <h3 className="mb-0.5 text-xs font-medium uppercase tracking-wider text-white/40">Заметки</h3>
                <p className="text-2xl font-bold tabular-nums text-white">{notesCount}</p>
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

        <Card className="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
                <CalendarDays className="h-4.5 w-4.5 text-violet-400" />
              </div>
              <div>
                <h3 className="mb-0.5 text-xs font-medium uppercase tracking-wider text-white/40">Календарь</h3>
                <p className="text-2xl font-bold tabular-nums text-white">{eventsCount}</p>
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

      <Card className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Участники семьи</h2>
            <p className="mt-1 text-sm text-white/40">Активные участники и их роли</p>
          </div>
          <Link href="/dashboard/family" className="text-xs text-white/50 transition-colors duration-150 hover:text-white/80">
            Управление
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {members.map((member) => {
            const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
            const name = member.nickname || profile?.full_name || "Unknown";

            return (
              <div
                key={member.id}
                className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-300">
                  {initials(name)}
                </div>
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="text-xs capitalize text-white/40">{member.role}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
        <h2 className="mb-3 text-sm font-semibold text-white/80">Реклама (тест)</h2>
        <ins
          className="asm_async_creative"
          style={{ display: "inline-block", width: "246px", height: "369px", textAlign: "left", textDecoration: "none" }}
          data-asm-cdn="cdn.adspirit.de"
          data-asm-host="bmm.adspirit.de"
          data-asm-params="pid=45"
        />
        <Script src="https://cdn.adspirit.de/adasync.min.js" strategy="afterInteractive" />
      </Card>
    </section>
  );
}
