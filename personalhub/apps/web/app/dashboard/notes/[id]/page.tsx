import { notFound, redirect } from "next/navigation";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoFamilyState } from "@/components/layout/NoFamilyState";
import { assertCanViewModule, canEditModule } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { data: note } = await supabase
    .from("notes")
    .select("id, title, content, is_shared, pinned, color")
    .eq("id", id)
    .maybeSingle();

  if (!note) {
    notFound();
  }

  return <NoteEditor note={note} canEdit={canEditNotes} />;
}
