"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { updateNoteAction } from "@/lib/actions/notes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ColorPicker } from "./ColorPicker";

type NoteEditorProps = {
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

export function NoteEditor({ note, canEdit = true }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content ?? "");
  const [isShared, setIsShared] = useState(note.is_shared);
  const [isPinned, setIsPinned] = useState(note.pinned);
  const [color, setColor] = useState(note.color ?? "#ffffff");
  const [isSaving, setIsSaving] = useState(false);

  const preview = useMemo(() => content || "_Пустая заметка_", [content]);

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      const result = await updateNoteAction(note.id, {
        title,
        content,
        is_shared: isShared,
        pinned: isPinned,
        color,
      });
      setIsSaving(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Заметка сохранена");
    }, 1000);

    return () => clearTimeout(timeout);
  }, [canEdit, note.id, title, content, isShared, isPinned, color]);

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/notes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Link>
        </Button>
        <Badge variant="secondary">
          {!canEdit ? "Только чтение" : isSaving ? "Сохранение..." : "Сохранено"}
        </Badge>
      </div>

      <Card className="grid gap-4 p-4" style={{ backgroundColor: color }}>
        <div className="grid gap-2">
          <Label htmlFor="note-title">Заголовок</Label>
          <Input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={!canEdit} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="note-content">Контент (Markdown)</Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={10}
            disabled={!canEdit}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isShared} onChange={(event) => setIsShared(event.target.checked)} disabled={!canEdit} />
            Общая
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} disabled={!canEdit} />
            Закрепить
          </label>
        </div>

        <div className="grid gap-2">
          <Label>Цвет</Label>
          <ColorPicker value={color} onChange={setColor} disabled={!canEdit} />
        </div>
      </Card>

      <Card className="grid gap-3 p-4">
        <h2 className="text-lg font-semibold">Предпросмотр</h2>
        <article className="prose max-w-none text-sm dark:prose-invert">
          <ReactMarkdown>{preview}</ReactMarkdown>
        </article>
      </Card>
    </section>
  );
}
