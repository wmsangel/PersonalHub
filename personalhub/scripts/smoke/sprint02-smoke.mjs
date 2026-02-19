import { createClient } from "@supabase/supabase-js";

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing env: ${key}`);
    process.exit(1);
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const result = {
  memberPermissionsSeed: false,
  calendarCrud: false,
  tasksSanity: false,
  shoppingSanity: false,
  notesSanity: false,
  rlsIsolation: false,
  details: [],
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stamp = Date.now();

let primaryUserId;
let outsiderUserId;
let familyId;
let memberId;
let listId;
let taskId;

const createAuthedClient = async (email, password) => {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
};

const cleanup = async () => {
  if (listId) await admin.from("shopping_lists").delete().eq("id", listId);
  if (familyId) await admin.from("families").delete().eq("id", familyId);
  if (primaryUserId) await admin.auth.admin.deleteUser(primaryUserId);
  if (outsiderUserId) await admin.auth.admin.deleteUser(outsiderUserId);
};

try {
  const primaryEmail = `sprint02-smoke-${stamp}@example.com`;
  const outsiderEmail = `sprint02-outsider-${stamp}@example.com`;
  const password = `Sprint02-${stamp}-P@55!`;

  const { data: primaryCreated, error: primaryCreateError } = await admin.auth.admin.createUser({
    email: primaryEmail,
    password,
    email_confirm: true,
  });
  if (primaryCreateError) throw primaryCreateError;
  primaryUserId = primaryCreated.user?.id;
  if (!primaryUserId) throw new Error("Failed to create primary user");

  const { data: outsiderCreated, error: outsiderCreateError } = await admin.auth.admin.createUser({
    email: outsiderEmail,
    password,
    email_confirm: true,
  });
  if (outsiderCreateError) throw outsiderCreateError;
  outsiderUserId = outsiderCreated.user?.id;
  if (!outsiderUserId) throw new Error("Failed to create outsider user");

  await admin.from("profiles").insert([
    { id: primaryUserId, full_name: "Sprint02 Smoke Primary", locale: "ru" },
    { id: outsiderUserId, full_name: "Sprint02 Smoke Outsider", locale: "ru" },
  ]);

  const { data: createdFamily, error: familyError } = await admin
    .from("families")
    .insert({ name: `Sprint02 Smoke ${stamp}`, created_by: primaryUserId, plan: "free" })
    .select("id")
    .single();
  if (familyError) throw familyError;
  familyId = createdFamily.id;

  const { data: createdMember, error: memberError } = await admin
    .from("family_members")
    .insert({
      family_id: familyId,
      user_id: primaryUserId,
      role: "admin",
      is_active: true,
      nickname: "Smoke Admin",
    })
    .select("id")
    .single();
  if (memberError) throw memberError;
  memberId = createdMember.id;

  // Trigger-based seed validation
  const permissions = await admin.from("member_permissions").select("module, can_view, can_edit").eq("member_id", memberId);
  if (permissions.error) throw permissions.error;
  const seededRows = permissions.data ?? [];
  result.memberPermissionsSeed = seededRows.length === 7;
  result.details.push(`seeded permissions rows: ${seededRows.length}`);

  // Calendar CRUD
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const createEvent = await admin
    .from("events")
    .insert({
      family_id: familyId,
      created_by: primaryUserId,
      title: `Smoke Event ${stamp}`,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      is_all_day: false,
    })
    .select("id")
    .single();
  if (createEvent.error) throw createEvent.error;
  const eventId = createEvent.data.id;

  const updateEvent = await admin.from("events").update({ title: `Smoke Event Updated ${stamp}` }).eq("id", eventId);
  if (updateEvent.error) throw updateEvent.error;

  const deleteEvent = await admin.from("events").delete().eq("id", eventId);
  if (deleteEvent.error) throw deleteEvent.error;
  result.calendarCrud = true;

  // Tasks sanity
  const createTask = await admin
    .from("tasks")
    .insert({
      family_id: familyId,
      created_by: primaryUserId,
      assigned_to: memberId,
      title: `Smoke Task ${stamp}`,
      status: "todo",
      priority: "medium",
    })
    .select("id")
    .single();
  if (createTask.error) throw createTask.error;
  taskId = createTask.data.id;
  const completeTask = await admin.from("tasks").update({ status: "done" }).eq("id", taskId);
  if (completeTask.error) throw completeTask.error;
  const dropTask = await admin.from("tasks").delete().eq("id", taskId);
  if (dropTask.error) throw dropTask.error;
  result.tasksSanity = true;

  // Shopping sanity
  const createList = await admin
    .from("shopping_lists")
    .insert({ family_id: familyId, title: `Smoke List ${stamp}`, is_active: true })
    .select("id")
    .single();
  if (createList.error) throw createList.error;
  listId = createList.data.id;

  const createItem = await admin
    .from("shopping_items")
    .insert({ list_id: listId, title: `Smoke Item ${stamp}`, added_by: memberId, is_checked: false })
    .select("id")
    .single();
  if (createItem.error) throw createItem.error;
  const itemId = createItem.data.id;

  const updateItem = await admin.from("shopping_items").update({ is_checked: true, checked_by: memberId }).eq("id", itemId);
  if (updateItem.error) throw updateItem.error;
  const deleteItem = await admin.from("shopping_items").delete().eq("id", itemId);
  if (deleteItem.error) throw deleteItem.error;
  result.shoppingSanity = true;

  // Notes sanity
  const createNote = await admin
    .from("notes")
    .insert({
      family_id: familyId,
      created_by: primaryUserId,
      title: `Smoke Note ${stamp}`,
      content: "smoke",
      is_shared: true,
      pinned: false,
    })
    .select("id")
    .single();
  if (createNote.error) throw createNote.error;
  const noteId = createNote.data.id;
  const updateNote = await admin.from("notes").update({ pinned: true }).eq("id", noteId);
  if (updateNote.error) throw updateNote.error;
  const deleteNote = await admin.from("notes").delete().eq("id", noteId);
  if (deleteNote.error) throw deleteNote.error;
  result.notesSanity = true;

  // RLS isolation check from outsider anon session
  const primaryClient = await createAuthedClient(primaryEmail, password);
  const outsiderClient = await createAuthedClient(outsiderEmail, password);

  const foreignTask = await primaryClient
    .from("tasks")
    .insert({
      family_id: familyId,
      created_by: primaryUserId,
      assigned_to: memberId,
      title: `RLS Task ${stamp}`,
      status: "todo",
      priority: "low",
    })
    .select("id")
    .single();
  if (foreignTask.error) throw foreignTask.error;

  const outsiderRead = await outsiderClient.from("tasks").select("id").eq("family_id", familyId).limit(1);
  if (outsiderRead.error) throw outsiderRead.error;

  result.rlsIsolation = (outsiderRead.data ?? []).length === 0;
  result.details.push(`outsider visible rows: ${(outsiderRead.data ?? []).length}`);

  await admin.from("tasks").delete().eq("id", foreignTask.data.id);
  await wait(50);

  const allPassed = Object.entries(result)
    .filter(([key]) => key !== "details")
    .every(([, value]) => value === true);

  console.log(JSON.stringify(result, null, 2));
  await cleanup();
  process.exit(allPassed ? 0 : 1);
} catch (error) {
  console.error("Sprint02 smoke failed");
  console.error(error);
  console.log(JSON.stringify(result, null, 2));
  await cleanup();
  process.exit(1);
}
