"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { deleteTaskAction, updateTaskStatusAction } from "@/lib/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TaskRow } from "./types";

type TaskItemProps = {
  task: TaskRow;
  assigneeLabel: string;
  canEdit?: boolean;
};

const priorityVariant = (priority: TaskRow["priority"]) => {
  if (priority === "high") return "destructive" as const;
  if (priority === "medium") return "secondary" as const;
  return "outline" as const;
};

const statusLabel = (status: TaskRow["status"]) => {
  if (status === "in_progress") return "В процессе";
  if (status === "done") return "Выполнена";
  return "Активна";
};

const isPastDue = (date: string | null): boolean => {
  if (!date) return false;
  const due = new Date(`${date}T23:59:59`);
  return due.getTime() < Date.now();
};

export function TaskItem({ task, assigneeLabel, canEdit = true }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const updateStatus = (status: TaskRow["status"]) => {
    startTransition(async () => {
      const result = await updateTaskStatusAction(task.id, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Статус задачи обновлён");
      router.refresh();
    });
  };

  const removeTask = () => {
    startTransition(async () => {
      const result = await deleteTaskAction(task.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Задача удалена");
      router.refresh();
    });
  };

  return (
    <div
      className="group surface-panel-soft flex items-start gap-3 rounded-[1.2rem]
                 p-4 transition-all duration-200
                 hover:-translate-y-0.5 hover:border-white/12 hover:bg-white/[0.05]"
    >
      <input
        type="checkbox"
        className="mt-1 h-4.5 w-4.5 shrink-0 accent-indigo-500"
        checked={task.status === "done"}
        onChange={(event) => updateStatus(event.target.checked ? "done" : "todo")}
        disabled={isPending || !canEdit}
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "mb-1.5 truncate text-[15px] font-medium tracking-tight text-white",
            task.status === "done" && "text-white/40 line-through",
          )}
        >
          {task.title}
        </p>
        {task.description ? <p className="mb-2 text-xs leading-6 text-white/50 line-clamp-2">{task.description}</p> : null}
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/32">
          {task.due_date ? (
            <span className={cn(isPastDue(task.due_date) && task.status !== "done" && "text-rose-400")}>до {task.due_date}</span>
          ) : null}
          <span>·</span>
          <span>{assigneeLabel}</span>
          <span>·</span>
          <span>{statusLabel(task.status)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
        {canEdit ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateStatus("todo")}>Сделать активной</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("in_progress")}>Сделать в процессе</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("done")}>Отметить выполненной</DropdownMenuItem>
              <DropdownMenuItem onClick={removeTask} className="text-destructive">
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-xs text-white/35">Только чтение</span>
        )}
      </div>
    </div>
  );
}
