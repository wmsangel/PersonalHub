"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

type TaskFilters = {
  status?: TaskStatus | "all";
  assignedTo?: string;
  priority?: TaskPriority;
};

type CreateTaskPayload = {
  title: string;
  description?: string;
  assigned_to?: string;
  priority?: TaskPriority;
  due_date?: string;
};

type UpdateTaskPayload = Partial<{
  title: string;
  description: string | null;
  assigned_to: string | null;
  priority: TaskPriority;
  due_date: string | null;
  status: TaskStatus;
  is_shared: boolean;
}>;

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

const getSessionFamilyContext = async (): Promise<
  ActionResult<{ userId: string; familyId: string }>
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

export async function getTasksAction(
  params: TaskFilters = {},
): Promise<ActionResult<Record<string, unknown>[]>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from("tasks")
    .select("*")
    .eq("family_id", context.data.familyId)
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.assignedTo) {
    query = query.eq("assigned_to", params.assignedTo);
  }

  if (params.priority) {
    query = query.eq("priority", params.priority);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as Record<string, unknown>[], error: null };
}

export async function createTaskAction(
  payload: CreateTaskPayload,
): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const title = payload.title.trim();
  if (!title) {
    return { data: null, error: "Task title is required" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      family_id: context.data.familyId,
      created_by: context.data.userId,
      title,
      description: payload.description?.trim() || null,
      assigned_to: payload.assigned_to || null,
      priority: payload.priority ?? "medium",
      due_date: payload.due_date || null,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Record<string, unknown>, error: null };
}

export async function updateTaskStatusAction(
  taskId: string,
  status: TaskStatus,
): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("family_id", context.data.familyId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Record<string, unknown>, error: null };
}

export async function updateTaskAction(
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const updateData: Record<string, unknown> = {};

  if (typeof payload.title === "string") {
    const title = payload.title.trim();
    if (!title) {
      return { data: null, error: "Task title cannot be empty" };
    }

    updateData.title = title;
  }

  if (payload.description !== undefined) {
    updateData.description = payload.description;
  }

  if (payload.assigned_to !== undefined) {
    updateData.assigned_to = payload.assigned_to;
  }

  if (payload.priority !== undefined) {
    updateData.priority = payload.priority;
  }

  if (payload.due_date !== undefined) {
    updateData.due_date = payload.due_date;
  }

  if (payload.status !== undefined) {
    updateData.status = payload.status;
    updateData.completed_at = payload.status === "done" ? new Date().toISOString() : null;
  }

  if (payload.is_shared !== undefined) {
    updateData.is_shared = payload.is_shared;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .eq("family_id", context.data.familyId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Record<string, unknown>, error: null };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult<{ id: string }>> {
  const context = await getSessionFamilyContext();

  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("family_id", context.data.familyId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { id: String(data.id) }, error: null };
}
