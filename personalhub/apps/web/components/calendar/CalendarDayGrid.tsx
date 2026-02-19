import { cn } from "@/lib/utils";
import { EventDialog } from "./EventDialog";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  location: string | null;
};

type CalendarDayGridProps = {
  monthDate: Date;
  events: CalendarEvent[];
  canEdit?: boolean;
};

const WEEK_DAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTimeLabel = (value: string): string =>
  new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export function CalendarDayGrid({ monthDate, events, canEdit = true }: CalendarDayGridProps) {
  const gridStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const eventsByDay = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const key = formatDateKey(new Date(event.starts_at));
    const bucket = acc[key] ?? [];
    bucket.push(event);
    acc[key] = bucket;
    return acc;
  }, {});

  const cells = Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-7 gap-2">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-center text-xs font-medium text-white/40">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
        {cells.map((date) => {
          const dateKey = formatDateKey(date);
          const dayEvents = eventsByDay[dateKey] ?? [];
          const visibleEvents = dayEvents.slice(0, 3);
          const moreCount = Math.max(0, dayEvents.length - visibleEvents.length);
          const isOutsideMonth = date.getMonth() !== monthDate.getMonth();
          const isToday = formatDateKey(new Date()) === dateKey;

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-24 cursor-pointer border border-white/[0.06] p-2 transition-colors duration-150 hover:bg-white/[0.02]",
                isOutsideMonth && "opacity-50",
                isToday && "ring-2 ring-indigo-500/30 ring-inset",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium", isToday ? "text-indigo-400" : "text-white/70")}>
                  {date.getDate()}
                </span>
                {!isOutsideMonth && canEdit ? (
                  <EventDialog mode="create" triggerLabel="+" defaultStartAt={dateKey} defaultEndAt={dateKey} canEdit={canEdit} />
                ) : null}
              </div>

              <div className="mt-1 space-y-1">
                {visibleEvents.map((event) => (
                  canEdit ? (
                    <EventDialog
                      key={event.id}
                      mode="edit"
                      triggerLabel={`${event.is_all_day ? "Весь день" : toTimeLabel(event.starts_at)} · ${event.title}`}
                      event={event}
                      canEdit={canEdit}
                    />
                  ) : (
                    <p key={event.id} className="truncate rounded px-1.5 py-0.5 text-[10px] text-white/80 bg-violet-500/20">
                      {event.is_all_day ? "Весь день" : toTimeLabel(event.starts_at)} · {event.title}
                    </p>
                  )
                ))}

                {moreCount > 0 ? <span className="px-1.5 text-[9px] text-white/30">+{moreCount} ещё</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
