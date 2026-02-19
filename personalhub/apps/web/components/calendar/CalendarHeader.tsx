import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type CalendarHeaderProps = {
  monthLabel: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
};

export function CalendarHeader({ monthLabel, prevHref, nextHref, todayHref }: CalendarHeaderProps) {
  return (
    <header className="mb-2 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
          <CalendarDays className="h-6 w-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Календарь</h1>
          <p className="mt-0.5 text-sm text-white/40">Планируй семейные события и встречи.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={todayHref}>Сегодня</Link>
        </Button>
        <Button asChild variant="outline" size="icon">
          <Link href={prevHref} aria-label="Предыдущий месяц">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <p className="min-w-36 text-center text-sm font-medium capitalize text-white/80">{monthLabel}</p>
        <Button asChild variant="outline" size="icon">
          <Link href={nextHref} aria-label="Следующий месяц">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
