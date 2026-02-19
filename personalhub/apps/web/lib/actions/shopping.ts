"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

const getSessionFamilyContext = async (): Promise<
  ActionResult<{ userId: string; familyId: string; memberId: string | null }>
> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data: membership, error } = await supabase
    .from("family_members")
    .select("id, family_id")
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

  return {
    data: {
      userId: user.id,
      familyId: membership.family_id,
      memberId: membership.id,
    },
    error: null,
  };
};

export async function getOrCreateActiveShoppingListAction(): Promise<
  ActionResult<{ id: string; family_id: string; title: string }>
> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("shopping_lists")
    .select("id, family_id, title")
    .eq("family_id", context.data.familyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { data: null, error: existingError.message };
  }

  if (existing) {
    return { data: { id: existing.id, family_id: existing.family_id, title: existing.title }, error: null };
  }

  const { data: created, error: createError } = await supabase
    .from("shopping_lists")
    .insert({
      family_id: context.data.familyId,
      title: "Список покупок",
      is_active: true,
    })
    .select("id, family_id, title")
    .single();

  if (createError) {
    return { data: null, error: createError.message };
  }

  return { data: created, error: null };
}

export async function addShoppingItemAction(payload: {
  listId: string;
  title: string;
  quantity?: string;
  category?: string;
}): Promise<ActionResult<{ id: string }>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const title = payload.title.trim();
  if (!title) {
    return { data: null, error: "Item title is required" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      list_id: payload.listId,
      title,
      quantity: payload.quantity?.trim() || null,
      category: payload.category?.trim() || null,
      added_by: context.data.memberId,
    })
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { id: data.id }, error: null };
}

export async function toggleShoppingItemAction(payload: {
  itemId: string;
  isChecked: boolean;
}): Promise<ActionResult<{ id: string }>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .update({
      is_checked: payload.isChecked,
      checked_by: payload.isChecked ? context.data.memberId : null,
    })
    .eq("id", payload.itemId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { id: data.id }, error: null };
}

export async function deleteShoppingItemAction(itemId: string): Promise<ActionResult<{ id: string }>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("id", itemId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { id: data.id }, error: null };
}

export async function clearCheckedShoppingItemsAction(listId: string): Promise<ActionResult<{ count: number }>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("list_id", listId)
    .eq("is_checked", true)
    .select("id");

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { count: data.length }, error: null };
}
