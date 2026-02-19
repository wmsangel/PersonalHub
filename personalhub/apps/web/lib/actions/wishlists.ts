"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

type WishlistPriority = "low" | "medium" | "high";

type WishlistContext = {
  userId: string;
  familyId: string;
  memberId: string;
  role: "admin" | "adult" | "child" | "guest";
  canView: boolean;
  canEdit: boolean;
};

type WishlistRow = {
  id: string;
  family_id: string;
  owner_member_id: string;
  title: string;
  is_shared: boolean;
  created_at: string;
};

type WishlistItemRow = {
  id: string;
  wishlist_id: string;
  title: string;
  url: string | null;
  price: string | null;
  currency: string;
  priority: WishlistPriority;
  is_reserved: boolean;
  reserved_by: string | null;
  created_at: string;
};

type WishlistWithItems = WishlistRow & {
  items: WishlistItemRow[];
};

type CreateWishlistPayload = {
  title: string;
  is_shared?: boolean;
  owner_member_id?: string;
};

type CreateWishlistItemPayload = {
  wishlist_id: string;
  title: string;
  url?: string;
  price?: number;
  currency?: string;
  priority?: WishlistPriority;
};

const getWishlistContext = async (): Promise<ActionResult<WishlistContext>> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("id, family_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return { data: null, error: membershipError.message };
  }

  if (!membership) {
    return { data: null, error: "No active family membership" };
  }

  const { data: permission, error: permissionError } = await supabase
    .from("member_permissions")
    .select("can_view, can_edit")
    .eq("member_id", membership.id)
    .eq("module", "wishlists")
    .limit(1)
    .maybeSingle();

  if (permissionError) {
    return { data: null, error: permissionError.message };
  }

  const isAdmin = membership.role === "admin";

  return {
    data: {
      userId: user.id,
      familyId: membership.family_id,
      memberId: membership.id,
      role: membership.role as WishlistContext["role"],
      canView: permission?.can_view ?? isAdmin,
      canEdit: permission?.can_edit ?? isAdmin,
    },
    error: null,
  };
};

export async function getWishlistsAction(): Promise<ActionResult<WishlistWithItems[]>> {
  const context = await getWishlistContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canView) {
    return { data: null, error: "Access denied: wishlists view permission required" };
  }

  const supabase = await getSupabaseServerClient();
  const { data: wishlists, error: wishlistsError } = await supabase
    .from("wishlists")
    .select("*")
    .eq("family_id", context.data.familyId)
    .order("created_at", { ascending: false });

  if (wishlistsError) {
    return { data: null, error: wishlistsError.message };
  }

  const listRows = (wishlists ?? []) as WishlistRow[];
  const listIds = listRows.map((wishlist) => wishlist.id);

  if (listIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: items, error: itemsError } = await supabase
    .from("wishlist_items")
    .select("*")
    .in("wishlist_id", listIds)
    .order("created_at", { ascending: false });

  if (itemsError) {
    return { data: null, error: itemsError.message };
  }

  const grouped = new Map<string, WishlistItemRow[]>();
  (items ?? []).forEach((item) => {
    const current = grouped.get(item.wishlist_id) ?? [];
    grouped.set(item.wishlist_id, [...current, item as WishlistItemRow]);
  });

  return {
    data: listRows.map((wishlist) => ({
      ...wishlist,
      items: grouped.get(wishlist.id) ?? [],
    })),
    error: null,
  };
}

export async function createWishlistAction(payload: CreateWishlistPayload): Promise<ActionResult<WishlistRow>> {
  const context = await getWishlistContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canEdit) {
    return { data: null, error: "Access denied: wishlists edit permission required" };
  }

  const title = payload.title.trim();
  if (!title) {
    return { data: null, error: "Wishlist title is required" };
  }

  const ownerMemberId = payload.owner_member_id ?? context.data.memberId;
  if (payload.owner_member_id && payload.owner_member_id !== context.data.memberId && context.data.role !== "admin") {
    return { data: null, error: "Only admin can create wishlists for other members" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("wishlists")
    .insert({
      family_id: context.data.familyId,
      owner_member_id: ownerMemberId,
      title,
      is_shared: payload.is_shared ?? false,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/wishlists");
  return { data: data as WishlistRow, error: null };
}

export async function createWishlistItemAction(
  payload: CreateWishlistItemPayload,
): Promise<ActionResult<WishlistItemRow>> {
  const context = await getWishlistContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canEdit) {
    return { data: null, error: "Access denied: wishlists edit permission required" };
  }

  const title = payload.title.trim();
  if (!title) {
    return { data: null, error: "Item title is required" };
  }

  const currency = (payload.currency?.trim().toUpperCase() ?? "RUB").slice(0, 3);
  if (currency.length !== 3) {
    return { data: null, error: "Currency must be a 3-letter code" };
  }

  if (payload.price !== undefined && (!Number.isFinite(payload.price) || payload.price < 0)) {
    return { data: null, error: "Price must be greater than or equal to 0" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({
      wishlist_id: payload.wishlist_id,
      title,
      url: payload.url?.trim() || null,
      price: payload.price ?? null,
      currency,
      priority: payload.priority ?? "medium",
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/wishlists");
  return { data: data as WishlistItemRow, error: null };
}

export async function toggleReserveWishlistItemAction(
  itemId: string,
  reserved: boolean,
): Promise<ActionResult<{ id: string }>> {
  const context = await getWishlistContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canEdit) {
    return { data: null, error: "Access denied: wishlists edit permission required" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .update({
      is_reserved: reserved,
      reserved_by: reserved ? context.data.memberId : null,
    })
    .eq("id", itemId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/wishlists");
  return { data: { id: String(data.id) }, error: null };
}

export async function deleteWishlistItemAction(itemId: string): Promise<ActionResult<{ id: string }>> {
  const context = await getWishlistContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canEdit) {
    return { data: null, error: "Access denied: wishlists edit permission required" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/wishlists");
  return { data: { id: String(data.id) }, error: null };
}
