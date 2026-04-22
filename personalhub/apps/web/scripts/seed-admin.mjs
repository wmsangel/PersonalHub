#!/usr/bin/env node
// Seed (or re-seed) a Supabase auth user and make them admin of a family.
//
// Usage — from apps/web:
//   npm run seed:admin
//
//   Or directly:
//     node --env-file=.env.local scripts/seed-admin.mjs [email] [password] [familyName] [fullName]
//
// Overrides also accepted via env vars:
//   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_FAMILY, SEED_ADMIN_NAME
//
// The script is idempotent: running it again updates the password and keeps
// the user's existing family/membership.

import { createClient } from "@supabase/supabase-js";

const DEFAULTS = {
  email: "admin@personalhub.local",
  password: "DevAdmin123!",
  familyName: "Demo Family",
  fullName: "Admin",
};

const [, , argEmail, argPassword, argFamilyName, argFullName] = process.argv;
const email = (argEmail || process.env.SEED_ADMIN_EMAIL || DEFAULTS.email).toLowerCase();
const password = argPassword || process.env.SEED_ADMIN_PASSWORD || DEFAULTS.password;
const familyName = argFamilyName || process.env.SEED_ADMIN_FAMILY || DEFAULTS.familyName;
const fullName = argFullName || process.env.SEED_ADMIN_NAME || DEFAULTS.fullName;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("[seed-admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("[seed-admin] Tip: run with `npm run seed:admin` from apps/web so .env.local is loaded.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("[seed-admin] Password must be at least 8 characters.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser() {
  // Supabase Admin API has no "get user by email", so we page through the list.
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      const { error: updateError } = await admin.auth.admin.updateUserById(found.id, {
        password,
        email_confirm: true,
        user_metadata: { ...(found.user_metadata ?? {}), full_name: fullName },
      });
      if (updateError) throw new Error(`updateUserById: ${updateError.message}`);
      return { id: found.id, created: false };
    }
    if (!data.nextPage) break;
    page = data.nextPage;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  if (!data.user) throw new Error("createUser returned no user");
  return { id: data.user.id, created: true };
}

async function ensureProfile(userId) {
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, full_name: fullName, locale: "ru" }, { onConflict: "id" });
  if (error) throw new Error(`profiles upsert: ${error.message}`);
}

async function ensureFamily(userId) {
  const { data: existingMembership, error: membershipError } = await admin
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw new Error(`family_members lookup: ${membershipError.message}`);
  if (existingMembership) return { id: existingMembership.family_id, created: false };

  const { data: family, error: familyError } = await admin
    .from("families")
    .insert({ name: familyName, created_by: userId, plan: "free" })
    .select("id")
    .single();
  if (familyError) throw new Error(`families insert: ${familyError.message}`);
  if (!family) throw new Error("families insert returned no row");
  return { id: family.id, created: true };
}

async function ensureMembership(familyId, userId) {
  const { error } = await admin.from("family_members").upsert(
    {
      family_id: familyId,
      user_id: userId,
      role: "admin",
      nickname: fullName,
      is_active: true,
    },
    { onConflict: "family_id,user_id" },
  );
  if (error) throw new Error(`family_members upsert: ${error.message}`);
}

try {
  const user = await ensureUser();
  await ensureProfile(user.id);
  const family = await ensureFamily(user.id);
  await ensureMembership(family.id, user.id);

  console.log("[seed-admin] done");
  console.log(`  email:     ${email}`);
  console.log(`  password:  ${password}`);
  console.log(`  user_id:   ${user.id} (${user.created ? "created" : "updated"})`);
  console.log(`  family_id: ${family.id} (${family.created ? "created" : "reused"})`);
  console.log(`  family:    ${familyName}`);
} catch (error) {
  console.error(`[seed-admin] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
