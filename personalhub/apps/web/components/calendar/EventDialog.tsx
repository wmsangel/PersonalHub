"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEventAction, deleteEventAction, updateEventAction } from "@/lib/actions/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  location: string | null;
};

type EventDialogProps = {
  mode: "create" | "edit";
  triggerLabel: string;
  defaultStartAt?: string;
  defaultEndAt?: string;
  event?: CalendarEvent;
  canEdit?: boolean;
};

const toInputDatetimeValue = (isoValue: string): string => {
  const date = new Date(isoValue);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
};

const fromDateOnlyToDatetime = (dateValue: string, hours: number): string => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setHours(hours, 0, 0, 0);
  return toInputDatetimeValue(date.toISOString());
};

export function EventDialog({
  mode,
  triggerLabel,
  defaultStartAt,
  defaultEndAt,
  event,
  canEdit = true,
}: EventDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initial = useMemo(() => {
    if (mode === "edit" && event) {
      return {
        title: event.title,
        description: event.description ?? "",
        startsAt: toInputDatetimeValue(event.starts_at),
        endsAt: toInputDatetimeValue(event.ends_at),
        isAllDay: event.is_all_day,
        location: event.location ?? "",
      };
    }

    const fallbackDate = new Date().toISOString().slice(0, 10);
    return {
      title: "",
      description: "",
      startsAt: defaultStartAt ? fromDateOnlyToDatetime(defaultStartAt, 9) : fromDateOnlyToDatetime(fallbackDate, 9),
      endsAt: defaultEndAt ? fromDateOnlyToDatetime(defaultEndAt, 10) : fromDateOnlyToDatetime(fallbackDate, 10),
      isAllDay: false,
      location: "",
    };
  }, [defaultEndAt, defaultStartAt, event, mode]);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [startsAt, setStartsAt] = useState(initial.startsAt);
  const [endsAt, setEndsAt] = useState(initial.endsAt);
  const [isAllDay, setIsAllDay] = useState(initial.isAllDay);
  const [location, setLocation] = useState(initial.location);

  const resetForm = () => {
    setTitle(initial.title);
    setDescription(initial.description);
    setStartsAt(initial.startsAt);
    setEndsAt(initial.endsAt);
    setIsAllDay(initial.isAllDay);
    setLocation(initial.location);
  };

  const onSubmit = () => {
    startTransition(async () => {
      if (!canEdit) {
        toast.error("Недостаточно прав для редактирования");
        return;
      }

      const payload = {
        title,
        description,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        is_all_day: isAllDay,
        location,
      };

      const result =
        mode === "edit" && event
          ? await updateEventAction(event.id, payload)
          : await createEventAction(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "edit" ? "Событие обновлено" : "Событие создано");
      setIsOpen(false);
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!event) {
      return;
    }

    startTransition(async () => {
      if (!canEdit) {
        toast.error("Недостаточно прав для редактирования");
        return;
      }

      const result = await deleteEventAction(event.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Событие удалено");
      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        setIsOpen(next);
        if (!next) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={mode === "edit" ? "ghost" : "outline"}
          size={mode === "edit" ? "sm" : "sm"}
          className={
            mode === "edit"
              ? "h-auto justify-start rounded px-1.5 py-0.5 text-[10px] text-violet-200 bg-violet-500/20 hover:bg-violet-500/30"
              : undefined
          }
          disabled={!canEdit}
          title={!canEdit ? "Только чтение" : undefined}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Редактировать событие" : "Новое событие"}</DialogTitle>
          <DialogDescription>Заполни поля события и сохрани изменения.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="event-title">Название</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Встреча с учителем"
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="event-description">Описание</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Что важно не забыть"
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-1.5 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="event-starts-at">Начало</Label>
              <Input
                id="event-starts-at"
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="event-ends-at">Окончание</Label>
              <Input
                id="event-ends-at"
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isAllDay} onChange={(event) => setIsAllDay(event.target.checked)} disabled={!canEdit} />
            Весь день
          </label>

          <div className="grid gap-1.5">
            <Label htmlFor="event-location">Место</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Школа"
              disabled={!canEdit}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {mode === "edit" ? (
            <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
              Удалить
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isPending}>
            Отмена
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isPending || !canEdit}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
