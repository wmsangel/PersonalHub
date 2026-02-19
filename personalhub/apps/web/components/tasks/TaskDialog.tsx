"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { createTaskAction } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { FamilyMemberOption, TaskPriority } from "./types";

type TaskDialogProps = {
  members: FamilyMemberOption[];
  canEdit?: boolean;
};

export function TaskDialog({ members, canEdit = true }: TaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canEdit} title={!canEdit ? "Только чтение" : undefined}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить задачу
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая задача</DialogTitle>
          <DialogDescription>Создай задачу и назначь исполнителя.</DialogDescription>
        </DialogHeader>

        <form
          id="task-create-form"
          className="grid gap-4"
          action={(formData) => {
            if (!canEdit) {
              toast.error("Недостаточно прав для изменения задач");
              return;
            }

            startTransition(async () => {
              const title = String(formData.get("title") ?? "").trim();
              const description = String(formData.get("description") ?? "").trim();
              const assignedTo = String(formData.get("assigned_to") ?? "");
              const priority = String(formData.get("priority") ?? "medium") as TaskPriority;
              const dueDate = String(formData.get("due_date") ?? "");

              const result = await createTaskAction({
                title,
                description: description || undefined,
                assigned_to: assignedTo || undefined,
                priority,
                due_date: dueDate || undefined,
              });

              if (result.error) {
                toast.error(result.error);
                return;
              }

              toast.success("Задача создана");
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="title">Название</Label>
            <Input id="title" name="title" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Приоритет</Label>
            <select
              id="priority"
              name="priority"
              defaultValue="medium"
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assigned_to">Исполнитель</Label>
            <select
              id="assigned_to"
              name="assigned_to"
              defaultValue=""
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Без назначения</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="due_date">Дедлайн</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form="task-create-form" disabled={isPending || !canEdit}>
            <Save className="mr-2 h-4 w-4" />
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
