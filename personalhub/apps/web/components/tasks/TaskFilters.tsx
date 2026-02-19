import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FamilyMemberOption } from "./types";

type TaskFiltersProps = {
  currentStatus: string;
  currentPriority: string;
  currentAssignedTo: string;
  members: FamilyMemberOption[];
};

export function TaskFilters({
  currentStatus,
  currentPriority,
  currentAssignedTo,
  members,
}: TaskFiltersProps) {
  const statusHref = (status: string) => {
    const params = new URLSearchParams();
    params.set("status", status);
    params.set("priority", currentPriority || "all");
    params.set("assignedTo", currentAssignedTo || "all");
    return `/dashboard/tasks?${params.toString()}`;
  };

  return (
    <Card className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-6">
        <Link
          href={statusHref("all")}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all duration-150 ${
            currentStatus === "all"
              ? "bg-white/[0.08] text-white"
              : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
          }`}
        >
          Все
        </Link>
        <Link
          href={statusHref("todo")}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all duration-150 ${
            currentStatus === "todo"
              ? "bg-white/[0.08] text-white"
              : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
          }`}
        >
          Активные
        </Link>
        <Link
          href={statusHref("in_progress")}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all duration-150 ${
            currentStatus === "in_progress"
              ? "bg-white/[0.08] text-white"
              : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
          }`}
        >
          В процессе
        </Link>
        <Link
          href={statusHref("done")}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all duration-150 ${
            currentStatus === "done"
              ? "bg-white/[0.08] text-white"
              : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
          }`}
        >
          Выполненные
        </Link>
      </div>

      <form method="get" className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <input type="hidden" name="status" value={currentStatus || "all"} />

        <div className="grid gap-2 lg:col-span-1">
          <Label htmlFor="priority" className="text-xs text-white/40">
            Приоритет
          </Label>
          <select
            id="priority"
            name="priority"
            defaultValue={currentPriority || "all"}
            className="h-10 rounded-lg border border-white/[0.08] bg-[#0f0f11] px-3 text-sm text-white outline-none transition-all duration-150 hover:border-white/[0.12]"
          >
            <option value="all">Все</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>

        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="assignedTo" className="text-xs text-white/40">
            Исполнитель
          </Label>
          <select
            id="assignedTo"
            name="assignedTo"
            defaultValue={currentAssignedTo || "all"}
            className="h-10 rounded-lg border border-white/[0.08] bg-[#0f0f11] px-3 text-sm text-white outline-none transition-all duration-150 hover:border-white/[0.12]"
          >
            <option value="all">Все</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid items-end">
          <Button type="submit">Применить</Button>
        </div>
      </form>
    </Card>
  );
}
