"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

type NotePayload = {
  title?: string;
  content?: string;
  is_shared?: boolean;
  pinned?: boolean;
  color?: string;
};

const getSessionFamilyContext = async (): Promise<ActionResult<{ userId: string; familyId: string }>> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data: membership, error } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!membership) {
    return { data: null, error: "No active family membership" };
  }

  return { data: { userId: user.id, familyId: membership.family_id }, error: null };
};

export async function createNoteAction(payload: NotePayload = {}): Promise<ActionResult<{ id: string }>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .insert({
      family_id: context.data.familyId,
      created_by: context.data.userId,
      title: payload.title?.trim() || "Новая заметка",
      content: payload.content ?? "",
      is_shared: payload.is_shared ?? false,
      pinned: payload.pinned ?? false,
      color: payload.color ?? "#ffffff",
    })
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { id: data.id }, error: null };
}

export async function updateNoteAction(noteId: string, payload: NotePayload): Promise<ActionResult<{ id: string }>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const updateData: Record<string, unknown> = {};

  if (payload.title !== undefined) {
    updateData.title = payload.title;
  }
  if (payload.content !== undefined) {
    updateData.content = payload.content;
  }
  if (payload.is_shared !== undefined) {
    updateData.is_shared = payload.is_shared;
  }
  if (payload.pinned !== undefined) {
    updateData.pinned = payload.pinned;
  }
  if (payload.color !== undefined) {
    updateData.color = payload.color;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .update(updateData)
    .eq("id", noteId)
    .eq("family_id", context.data.familyId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { id: data.id }, error: null };
}

export async function deleteNoteAction(noteId: string): Promise<ActionResult<{ id: string }>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("family_id", context.data.familyId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { id: data.id }, error: null };
}
