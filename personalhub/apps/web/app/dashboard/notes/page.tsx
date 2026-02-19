import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { createNoteAction } from "@/lib/actions/notes";
import { assertCanViewModule, canEditModule } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NoFamilyState } from "@/components/layout/NoFamilyState";
import { NoteCard } from "@/components/notes/NoteCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const readParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export default async function NotesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = readParam(params.view) === "shared" ? "shared" : "my";

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
    .eq("module", "notes")
    .limit(1)
    .maybeSingle();

  const modulePermissions = {
    notes: {
      canView: permission.data?.can_view ?? membership.data.role === "admin",
      canEdit: permission.data?.can_edit ?? membership.data.role === "admin",
    },
  };

  try {
    assertCanViewModule(modulePermissions, "notes");
  } catch {
    notFound();
  }
  const canEditNotes = canEditModule(modulePermissions, "notes");

  let query = supabase
    .from("notes")
    .select("id, title, content, is_shared, pinned, color, created_by")
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (view === "shared") {
    query = query.eq("is_shared", true);
  } else {
    query = query.eq("created_by", user.id);
  }

  const { data: notes } = await query;

  return (
    <section className="grid gap-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
            <FileText className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Заметки</h1>
            <p className="mt-0.5 text-sm text-white/40">Личные и общие заметки семьи.</p>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            const result = await createNoteAction({ is_shared: view === "shared" });
            if (result.data?.id) {
              const { redirect } = await import("next/navigation");
              redirect(`/dashboard/notes/${result.data.id}`);
            }
          }}
        >
          <Button type="submit" disabled={!canEditNotes} title={!canEditNotes ? "Только чтение" : undefined}>
            <Plus className="mr-2 h-4 w-4" />
            Создать заметку
          </Button>
        </form>
      </div>

      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-5 text-sm">
        <Button asChild variant={view === "my" ? "default" : "outline"} size="sm">
          <Link href="/dashboard/notes?view=my">Мои заметки</Link>
        </Button>
        <Button asChild variant={view === "shared" ? "default" : "outline"} size="sm">
          <Link href="/dashboard/notes?view=shared">Общие</Link>
        </Button>
      </div>

      {!notes || notes.length === 0 ? (
        <Card className="grid justify-items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-10 text-center">
          <p className="text-base font-medium text-white">Нет заметок в этом разделе</p>
          <p className="text-sm text-white/40">Создай первую заметку и начни собирать важные мысли.</p>
        </Card>
      ) : (
        <div className="columns-1 gap-3 md:columns-2 xl:columns-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} canEdit={canEditNotes} />
          ))}
        </div>
      )}
    </section>
  );
}
