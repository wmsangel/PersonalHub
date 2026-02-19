"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ModuleName = "calendar" | "tasks" | "notes" | "finances" | "wishlists" | "shopping" | "documents";
export type FamilyRole = "admin" | "adult" | "child" | "guest";

type MemberPermissionRow = {
  id: string;
  family_id: string;
  member_id: string;
  module: ModuleName;
  can_view: boolean;
  can_edit: boolean;
};

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

const MODULES: ModuleName[] = ["calendar", "tasks", "notes", "finances", "wishlists", "shopping", "documents"];

const getSessionFamilyContext = async (): Promise<
  ActionResult<{ userId: string; familyId: string; memberRole: FamilyRole }>
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
    .select("family_id, role")
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
      memberRole: membership.role as FamilyRole,
    },
    error: null,
  };
};

const getDefaultPermissionsByRole = (
  role: FamilyRole,
): Array<{ module: ModuleName; can_view: boolean; can_edit: boolean }> => {
  const isAdmin = role === "admin";
  const isAdult = role === "adult";
  const isChildOrGuest = role === "child" || role === "guest";

  const canAccessAdultModules = isAdmin || isAdult;
  const canAccessChildModules = isAdmin || isAdult || isChildOrGuest;

  return MODULES.map((module) => {
    if (module === "tasks" || module === "shopping") {
      return { module, can_view: canAccessChildModules, can_edit: canAccessChildModules };
    }

    if (module === "notes" || module === "calendar") {
      return { module, can_view: canAccessAdultModules, can_edit: canAccessAdultModules };
    }

    if (module === "finances" || module === "wishlists" || module === "documents") {
      return { module, can_view: isAdmin, can_edit: isAdmin };
    }

    return { module, can_view: false, can_edit: false };
  });
};

const resolveTargetMemberFamily = async (memberId: string): Promise<ActionResult<{ familyId: string }>> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("id", memberId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: "Target family member was not found" };
  }

  return { data: { familyId: data.family_id }, error: null };
};

export async function getMemberPermissionsAction(memberId: string): Promise<ActionResult<MemberPermissionRow[]>> {
  const context = await getSessionFamilyContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const targetMember = await resolveTargetMemberFamily(memberId);
  if (targetMember.error || !targetMember.data) {
    return { data: null, error: targetMember.error ?? "Failed to resolve member" };
  }

  if (targetMember.data.familyId !== context.data.familyId) {
    return { data: null, error: "Access denied for another family" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("member_permissions")
    .select("id, family_id, member_id, module, can_view, can_edit")
    .eq("family_id", context.data.familyId)
    .eq("member_id", memberId)
    .order("module", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as MemberPermissionRow[], error: null };
}

export async function updateMemberPermissionAction(
  memberId: string,
  module: ModuleName,
  payload: { can_view: boolean; can_edit: boolean },
): Promise<ActionResult<MemberPermissionRow>> {
  const context = await getSessionFamilyContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (context.data.memberRole !== "admin") {
    return { data: null, error: "Admin permissions required" };
  }

  const targetMember = await resolveTargetMemberFamily(memberId);
  if (targetMember.error || !targetMember.data) {
    return { data: null, error: targetMember.error ?? "Failed to resolve member" };
  }

  if (targetMember.data.familyId !== context.data.familyId) {
    return { data: null, error: "Access denied for another family" };
  }

  const nextCanView = payload.can_view;
  const nextCanEdit = payload.can_view ? payload.can_edit : false;

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("member_permissions")
    .upsert(
      {
        family_id: context.data.familyId,
        member_id: memberId,
        module,
        can_view: nextCanView,
        can_edit: nextCanEdit,
      },
      { onConflict: "member_id,module" },
    )
    .select("id, family_id, member_id, module, can_view, can_edit")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/family");
  return { data: data as MemberPermissionRow, error: null };
}

export async function bulkResetPermissionsAction(
  memberId: string,
  role: FamilyRole,
): Promise<ActionResult<{ updated: number }>> {
  const context = await getSessionFamilyContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (context.data.memberRole !== "admin") {
    return { data: null, error: "Admin permissions required" };
  }

  const targetMember = await resolveTargetMemberFamily(memberId);
  if (targetMember.error || !targetMember.data) {
    return { data: null, error: targetMember.error ?? "Failed to resolve member" };
  }

  if (targetMember.data.familyId !== context.data.familyId) {
    return { data: null, error: "Access denied for another family" };
  }

  const familyId = context.data.familyId;
  const defaults = getDefaultPermissionsByRole(role).map((permission) => ({
    family_id: familyId,
    member_id: memberId,
    module: permission.module,
    can_view: permission.can_view,
    can_edit: permission.can_edit,
  }));

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("member_permissions").upsert(defaults, {
    onConflict: "member_id,module",
  });

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/family");
  return { data: { updated: defaults.length }, error: null };
}
