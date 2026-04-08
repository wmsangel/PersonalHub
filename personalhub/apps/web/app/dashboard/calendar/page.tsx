import { notFound, redirect } from "next/navigation";
import { CalendarDays, Sparkles } from "lucide-react";
import { CalendarDayGrid } from "@/components/calendar/CalendarDayGrid";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { EventDialog } from "@/components/calendar/EventDialog";
import { NoFamilyState } from "@/components/layout/NoFamilyState";
import { Card } from "@/components/ui/card";
import { getEventsAction } from "@/lib/actions/calendar";
import { assertCanViewModule, canEditModule } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const readParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const toMonthParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const parseMonthParam = (monthParam: string): Date => {
  if (!/^\d{4}-\d{2}$/.test(monthParam)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [year, month] = monthParam.split("-").map((value) => Number.parseInt(value, 10));
  if (!year || !month || month < 1 || month > 12) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return new Date(year, month - 1, 1);
};

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const membership = await supabase
    .from("family_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership.data) {
    return <NoFamilyState />;
  }

  const permission = await supabase
    .from("member_permissions")
    .select("can_view, can_edit")
    .eq("member_id", membership.data.id)
    .eq("module", "calendar")
    .limit(1)
    .maybeSingle();

  const modulePermissions = {
    calendar: {
      canView: permission.data?.can_view ?? membership.data.role === "admin",
      canEdit: permission.data?.can_edit ?? membership.data.role === "admin",
    },
  };

  try {
    assertCanViewModule(modulePermissions, "calendar");
  } catch {
    notFound();
  }
  const canEditCalendar = canEditModule(modulePermissions, "calendar");

  const params = await searchParams;
  const monthParam = readParam(params.month);
  const monthDate = parseMonthParam(monthParam);

  const prevMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
  const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  const todayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const gridStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 41);
  gridEnd.setHours(23, 59, 59, 999);

  const eventsResult = await getEventsAction({
    from: gridStart.toISOString(),
    to: gridEnd.toISOString(),
  });

  const events = eventsResult.data ?? [];
  const eventsInMonth = events.filter((event) => {
    const eventDate = new Date(event.starts_at);
    return eventDate.getMonth() === monthDate.getMonth() && eventDate.getFullYear() === monthDate.getFullYear();
  });

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-violet-500/18 bg-violet-500/10">
            <CalendarDays className="h-6 w-6 text-violet-300" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/34">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              семейный ритм
            </div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">Календарь</h1>
            <p className="mt-1 text-sm text-white/42">События, планы и дедлайны в одном обзорном поле.</p>
          </div>
        </div>

        <EventDialog mode="create" triggerLabel="Добавить событие" canEdit={canEditCalendar} />
      </div>

      <CalendarHeader
        monthLabel={new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(monthDate)}
        prevHref={`/dashboard/calendar?month=${toMonthParam(prevMonth)}`}
        nextHref={`/dashboard/calendar?month=${toMonthParam(nextMonth)}`}
        todayHref={`/dashboard/calendar?month=${toMonthParam(todayMonth)}`}
      />

      {eventsResult.error ? (
        <Card className="p-4 text-sm text-destructive">{eventsResult.error}</Card>
      ) : eventsInMonth.length === 0 ? (
        <Card className="grid justify-items-center gap-2 p-10 text-center">
          <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-violet-500/10 text-violet-300">
            <CalendarDays className="h-8 w-8" />
          </div>
          <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">В этом месяце пока спокойно</p>
          <p className="max-w-md text-sm leading-7 text-white/42">Создай первое событие и начни вести семейный календарь без пересечений и забытых планов.</p>
          <EventDialog mode="create" triggerLabel="Создать событие" canEdit={canEditCalendar} />
        </Card>
      ) : (
        <CalendarDayGrid monthDate={monthDate} events={events} canEdit={canEditCalendar} />
      )}
    </section>
  );
}
