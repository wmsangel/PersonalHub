import { getSupabaseAdminClient } from "./supabase/admin";

export const expirePendingInvites = async (familyId: string): Promise<string | null> => {
  const admin = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { error } = await admin
    .from("family_invites")
    .update({ status: "expired" })
    .eq("family_id", familyId)
    .eq("status", "pending")
    .lt("expires_at", nowIso);

  return error?.message ?? null;
};
