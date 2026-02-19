"use server";

import { redirect } from "next/navigation";
import { INVITED_PROFILE_PLACEHOLDER } from "./constants";
import { expirePendingInvites } from "../lib/invites";
import { getSupabaseAdminClient } from "../lib/supabase/admin";
import { getSupabaseServerClient } from "../lib/supabase/server";

const toText = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const redirectToFrom = (formData: FormData, fallback: string): string => {
  const redirectTo = toText(formData, "redirect_to");
  return redirectTo || fallback;
};

const withStatus = (path: string, message: string, type: "error" | "success"): never => {
  const query = new URLSearchParams({
    status: type,
    message,
  });

  redirect(`${path}?${query.toString()}`);
};

const findUserByEmail = async (
  admin: ReturnType<typeof getSupabaseAdminClient>,
  email: string,
): Promise<{ id: string } | null> => {
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const found = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());

    if (found) {
      return { id: found.id };
    }

    if (!data.nextPage) {
      return null;
    }

    page = data.nextPage;
  }

  return null;
};

export async function signInAction(formData: FormData): Promise<void> {
  const email = toText(formData, "email");
  const password = toText(formData, "password");
  const redirectTo = redirectToFrom(formData, "/dashboard");

  if (!email || !password) {
    return withStatus("/auth", "Email and password are required.", "error");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return withStatus("/auth", error.message, "error");
  }

  redirect(redirectTo);
}

export async function signUpAction(formData: FormData): Promise<void> {
  const email = toText(formData, "email");
  const password = toText(formData, "password");
  const fullName = toText(formData, "full_name");

  if (!email || !password) {
    return withStatus("/auth", "Email and password are required.", "error");
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return withStatus("/auth", error.message, "error");
  }

  if (!data.session) {
    return withStatus("/auth", "Account created. Confirm email, then sign in.", "success");
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const fullName = toText(formData, "full_name");
  const familyName = toText(formData, "family_name");
  const nickname = toText(formData, "nickname") || fullName;

  if (!fullName || !familyName) {
    return withStatus("/dashboard", "Full name and family name are required.", "error");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return withStatus("/auth", "Please sign in first.", "error");
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      locale: "ru",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return withStatus("/dashboard", profileError.message, "error");
  }

  const { data: existingMemberships, error: existingMembershipError } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  if (existingMembershipError) {
    return withStatus("/dashboard", existingMembershipError.message, "error");
  }

  if ((existingMemberships ?? []).length > 0) {
    return redirect("/dashboard");
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({
      name: familyName,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (familyError) {
    return withStatus("/dashboard", familyError.message, "error");
  }

  if (!family) {
    return withStatus("/dashboard", "Failed to create family.", "error");
  }

  const { error: familyMemberError } = await supabase.from("family_members").insert({
    family_id: family.id,
    user_id: user.id,
    role: "admin",
    nickname,
    is_active: true,
  });

  if (familyMemberError) {
    return withStatus("/dashboard", familyMemberError.message, "error");
  }

  return withStatus("/dashboard", "Onboarding completed.", "success");
}

export async function acceptInviteAction(formData: FormData): Promise<void> {
  const fullName = toText(formData, "full_name");
  const nickname = toText(formData, "nickname");

  if (!fullName) {
    return withStatus("/invite/accept", "Full name is required.", "error");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return withStatus("/auth", "Please sign in first.", "error");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("id, family_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return withStatus("/invite/accept", membershipError.message, "error");
  }

  if (!membership) {
    return withStatus("/dashboard", "No active family invitation found.", "error");
  }

  const expireError = await expirePendingInvites(membership.family_id);
  if (expireError) {
    return withStatus("/invite/accept", expireError, "error");
  }

  const userEmail = user.email?.toLowerCase() ?? "";
  const { data: pendingInviteByUser, error: pendingInviteByUserError } = await supabase
    .from("family_invites")
    .select("id, expires_at")
    .eq("family_id", membership.family_id)
    .eq("status", "pending")
    .eq("invited_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingInviteByUserError) {
    return withStatus("/invite/accept", pendingInviteByUserError.message, "error");
  }

  const { data: pendingInviteByEmail, error: pendingInviteByEmailError } = userEmail
    ? await supabase
        .from("family_invites")
        .select("id, expires_at")
        .eq("family_id", membership.family_id)
        .eq("status", "pending")
        .eq("invited_email", userEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };

  if (pendingInviteByEmailError) {
    return withStatus("/invite/accept", pendingInviteByEmailError.message, "error");
  }

  const pendingInvite = pendingInviteByUser ?? pendingInviteByEmail;

  if (!pendingInvite) {
    return withStatus("/invite/accept", "Invite is missing or expired.", "error");
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      locale: "ru",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return withStatus("/invite/accept", profileError.message, "error");
  }

  if (nickname) {
    const { error: nicknameError } = await supabase
      .from("family_members")
      .update({ nickname })
      .eq("id", membership.id)
      .eq("user_id", user.id);

    if (nicknameError) {
      return withStatus("/invite/accept", nicknameError.message, "error");
    }
  }

  const admin = getSupabaseAdminClient();
  const { error: inviteUpdateError } = await admin
    .from("family_invites")
    .update({
      invited_user_id: user.id,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("family_id", membership.family_id)
    .eq("status", "pending")
    .or(`invited_user_id.eq.${user.id},invited_email.eq.${userEmail}`);

  if (inviteUpdateError) {
    return withStatus("/invite/accept", inviteUpdateError.message, "error");
  }

  return withStatus("/dashboard", "Invitation accepted.", "success");
}

export async function inviteMemberAction(formData: FormData): Promise<void> {
  const email = toText(formData, "email").toLowerCase();
  const role = toText(formData, "role") || "child";
  const nickname = toText(formData, "nickname");

  if (!email) {
    return withStatus("/dashboard", "Invite email is required.", "error");
  }

  if (!email.includes("@")) {
    return withStatus("/dashboard", "Invalid email.", "error");
  }

  if (!["admin", "adult", "child", "guest"].includes(role)) {
    return withStatus("/dashboard", "Invalid role.", "error");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return withStatus("/auth", "Please sign in first.", "error");
  }

  if (user.email?.toLowerCase() === email) {
    return withStatus("/dashboard", "You cannot invite yourself.", "error");
  }

  const { data: myMembership, error: membershipError } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return withStatus("/dashboard", membershipError.message, "error");
  }

  if (!myMembership) {
    return withStatus("/dashboard", "Complete onboarding before inviting members.", "error");
  }

  if (myMembership.role !== "admin") {
    return withStatus("/dashboard", "Only admin can invite members.", "error");
  }

  const admin = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

  const expireError = await expirePendingInvites(myMembership.family_id);
  if (expireError) {
    return withStatus("/dashboard", expireError, "error");
  }

  let existingUserId: string | null = null;

  try {
    const existingUser = await findUserByEmail(admin, email);
    existingUserId = existingUser?.id ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check users.";
    return withStatus("/dashboard", message, "error");
  }

  const { data: existingPendingInvite, error: pendingInviteError } = await admin
    .from("family_invites")
    .select("id")
    .eq("family_id", myMembership.family_id)
    .eq("invited_email", email)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (pendingInviteError) {
    return withStatus("/dashboard", pendingInviteError.message, "error");
  }

  if (existingPendingInvite) {
    return withStatus("/dashboard", "Pending invite for this email already exists.", "error");
  }

  if (existingUserId) {
    const { data: existingMember, error: existingMemberError } = await admin
      .from("family_members")
      .select("id, is_active")
      .eq("family_id", myMembership.family_id)
      .eq("user_id", existingUserId)
      .limit(1)
      .maybeSingle();

    if (existingMemberError) {
      return withStatus("/dashboard", existingMemberError.message, "error");
    }

    if (existingMember?.is_active) {
      return withStatus("/dashboard", "This user is already in your family.", "error");
    }

    const fallbackName = nickname || email.split("@")[0] || "Family member";

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: existingUserId,
        full_name: fallbackName,
        locale: "ru",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      return withStatus("/dashboard", profileError.message, "error");
    }

    const { error: memberError } = await admin.from("family_members").upsert(
      {
        family_id: myMembership.family_id,
        user_id: existingUserId,
        role,
        nickname: nickname || null,
        is_active: true,
      },
      { onConflict: "family_id,user_id" },
    );

    if (memberError) {
      return withStatus("/dashboard", memberError.message, "error");
    }

    const { error: acceptedInviteError } = await admin.from("family_invites").insert({
      family_id: myMembership.family_id,
      invited_by: user.id,
      invited_user_id: existingUserId,
      invited_email: email,
      role,
      nickname: nickname || null,
      status: "accepted",
      accepted_at: nowIso,
      expires_at: expiresAtIso,
    });

    if (acceptedInviteError) {
      return withStatus("/dashboard", acceptedInviteError.message, "error");
    }

    return withStatus("/dashboard", "Existing user added to your family.", "success");
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);

  if (inviteError) {
    return withStatus("/dashboard", inviteError.message, "error");
  }

  const invitedUserId = invited.user?.id;

  if (!invitedUserId) {
    return withStatus("/dashboard", "Invite sent, but no user id returned.", "error");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: invitedUserId,
      full_name: INVITED_PROFILE_PLACEHOLDER,
      locale: "ru",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return withStatus("/dashboard", profileError.message, "error");
  }

  const { error: memberError } = await admin.from("family_members").upsert(
    {
      family_id: myMembership.family_id,
      user_id: invitedUserId,
      role,
      nickname: nickname || null,
      is_active: true,
    },
    { onConflict: "family_id,user_id" },
  );

  if (memberError) {
    return withStatus("/dashboard", memberError.message, "error");
  }

  const { error: inviteInsertError } = await admin.from("family_invites").insert({
    family_id: myMembership.family_id,
    invited_by: user.id,
    invited_user_id: invitedUserId,
    invited_email: email,
    role,
    nickname: nickname || null,
    status: "pending",
    expires_at: expiresAtIso,
  });

  if (inviteInsertError) {
    return withStatus("/dashboard", inviteInsertError.message, "error");
  }

  return withStatus("/dashboard", "Invitation sent.", "success");
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const inviteId = toText(formData, "invite_id");

  if (!inviteId) {
    return withStatus("/dashboard", "Invite id is required.", "error");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return withStatus("/auth", "Please sign in first.", "error");
  }

  const { data: myMembership, error: membershipError } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return withStatus("/dashboard", membershipError.message, "error");
  }

  if (!myMembership || myMembership.role !== "admin") {
    return withStatus("/dashboard", "Only admin can revoke invites.", "error");
  }

  const admin = getSupabaseAdminClient();
  const { data: invite, error: inviteError } = await admin
    .from("family_invites")
    .select("id, family_id, status")
    .eq("id", inviteId)
    .limit(1)
    .maybeSingle();

  if (inviteError) {
    return withStatus("/dashboard", inviteError.message, "error");
  }

  if (!invite || invite.family_id !== myMembership.family_id) {
    return withStatus("/dashboard", "Invite not found.", "error");
  }

  if (invite.status !== "pending") {
    return withStatus("/dashboard", "Only pending invites can be revoked.", "error");
  }

  const { error: revokeError } = await admin
    .from("family_invites")
    .update({ status: "revoked" })
    .eq("id", invite.id);

  if (revokeError) {
    return withStatus("/dashboard", revokeError.message, "error");
  }

  return withStatus("/dashboard", "Invite revoked.", "success");
}

export async function updateFamilyMemberRoleAction(formData: FormData): Promise<void> {
  const memberId = toText(formData, "member_id");
  const role = toText(formData, "role");

  if (!memberId || !["admin", "adult", "child", "guest"].includes(role)) {
    return withStatus("/dashboard/family", "Invalid role update payload.", "error");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return withStatus("/auth", "Please sign in first.", "error");
  }

  const { data: myMembership, error: myMembershipError } = await supabase
    .from("family_members")
    .select("id, family_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (myMembershipError) {
    return withStatus("/dashboard/family", myMembershipError.message, "error");
  }

  if (!myMembership || myMembership.role !== "admin") {
    return withStatus("/dashboard/family", "Only admin can update roles.", "error");
  }

  if (myMembership.id === memberId && role !== "admin") {
    return withStatus("/dashboard/family", "You cannot remove your own admin role.", "error");
  }

  const { error: updateError } = await supabase
    .from("family_members")
    .update({ role })
    .eq("id", memberId)
    .eq("family_id", myMembership.family_id);

  if (updateError) {
    return withStatus("/dashboard/family", updateError.message, "error");
  }

  return withStatus("/dashboard/family", "Member role updated.", "success");
}

export async function updateFamilySettingsAction(formData: FormData): Promise<void> {
  const familyId = toText(formData, "family_id");
  const familyName = toText(formData, "family_name");
  const plan = toText(formData, "plan");

  if (!familyId || !familyName || !["free", "premium", "family_plus"].includes(plan)) {
    return withStatus("/dashboard/family", "Invalid family settings payload.", "error");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return withStatus("/auth", "Please sign in first.", "error");
  }

  const { data: myMembership, error: myMembershipError } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (myMembershipError) {
    return withStatus("/dashboard/family", myMembershipError.message, "error");
  }

  if (!myMembership || myMembership.role !== "admin" || myMembership.family_id !== familyId) {
    return withStatus("/dashboard/family", "Only admin can update family settings.", "error");
  }

  const { error: updateError } = await supabase
    .from("families")
    .update({ name: familyName, plan })
    .eq("id", familyId);

  if (updateError) {
    return withStatus("/dashboard/family", updateError.message, "error");
  }

  return withStatus("/dashboard/family", "Family settings updated.", "success");
}
