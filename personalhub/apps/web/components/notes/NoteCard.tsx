"use client";

import Link from "next/link";
import { Pencil, Pin, Trash2 } from "lucide-react";
import { deleteNoteAction } from "@/lib/actions/notes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type NoteCardProps = {
  note: {
    id: string;
    title: string;
    content: string | null;
    is_shared: boolean;
    pinned: boolean;
    color: string | null;
  };
  canEdit?: boolean;
};

export function NoteCard({ note, canEdit = true }: NoteCardProps) {
  return (
    <Card
      className="group relative mb-3 break-inside-avoid rounded-[1.35rem] p-4
                 transition-all duration-200 hover:-translate-y-1 hover:border-white/12
                 hover:bg-white/[0.06]"
      style={{ backgroundColor: note.color || "rgba(255,255,255,0.03)" }}
    >
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <Button asChild size="icon" variant="ghost" className="h-7 w-7" disabled={!canEdit}>
          <Link href={`/dashboard/notes/${note.id}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-rose-400"
          disabled={!canEdit}
          onClick={async () => {
            if (!canEdit) {
              toast.error("Недостаточно прав для редактирования");
              return;
            }

            const result = await deleteNoteAction(note.id);
            if (result.error) {
              toast.error(result.error);
              return;
            }

            toast.success("Заметка удалена");
            window.location.reload();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {note.pinned ? <Pin className="mb-3 h-3.5 w-3.5 text-amber-400" /> : null}

      <h3 className="mb-2 pr-16 text-[15px] font-medium tracking-tight text-white line-clamp-1">{note.title}</h3>

      <p className="line-clamp-5 text-xs leading-6 text-white/50">{note.content?.slice(0, 180) || "Без текста"}</p>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
        <Badge variant={note.is_shared ? "default" : "secondary"}>{note.is_shared ? "Общая" : "Личная"}</Badge>

        <div className="text-xs text-white/35">{canEdit ? "Наведи для действий" : "Только чтение"}</div>
      </div>
    </Card>
  );
}
