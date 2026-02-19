"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

type EventInput = {
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
  is_all_day?: boolean;
  location?: string | null;
};

type CalendarEventRow = {
  id: string;
  family_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
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

  return {
    data: { userId: user.id, familyId: membership.family_id },
    error: null,
  };
};

const normalizeEventRange = (
  startsAtRaw: string,
  endsAtRaw: string,
  isAllDay: boolean,
): ActionResult<{ startsAtIso: string; endsAtIso: string }> => {
  const startsAt = new Date(startsAtRaw);
  const endsAt = new Date(endsAtRaw);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { data: null, error: "Invalid event datetime format" };
  }

  if (endsAt > startsAt) {
    return { data: { startsAtIso: startsAt.toISOString(), endsAtIso: endsAt.toISOString() }, error: null };
  }

  if (!isAllDay) {
    return { data: null, error: "Event end time must be greater than start time" };
  }

  const nextDay = new Date(startsAt);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  return {
    data: {
      startsAtIso: startsAt.toISOString(),
      endsAtIso: nextDay.toISOString(),
    },
    error: null,
  };
};

export async function getEventsAction(params: {
  from: string;
  to: string;
}): Promise<ActionResult<CalendarEventRow[]>> {
  const context = await getSessionFamilyContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const fromDate = new Date(params.from);
  const toDate = new Date(params.to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate <= fromDate) {
    return { data: null, error: "Invalid calendar range" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("family_id", context.data.familyId)
    .gte("starts_at", fromDate.toISOString())
    .lte("starts_at", toDate.toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as CalendarEventRow[], error: null };
}

export async function createEventAction(payload: EventInput): Promise<ActionResult<CalendarEventRow>> {
  const context = await getSessionFamilyContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const title = payload.title.trim();
  if (!title) {
    return { data: null, error: "Event title is required" };
  }

  const isAllDay = payload.is_all_day ?? false;
  const range = normalizeEventRange(payload.starts_at, payload.ends_at, isAllDay);
  if (range.error || !range.data) {
    return { data: null, error: range.error ?? "Invalid event range" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      family_id: context.data.familyId,
      created_by: context.data.userId,
      title,
      description: payload.description?.trim() || null,
      starts_at: range.data.startsAtIso,
      ends_at: range.data.endsAtIso,
      is_all_day: isAllDay,
      location: payload.location?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { data: data as CalendarEventRow, error: null };
}

export async function updateEventAction(
  eventId: string,
  payload: Partial<EventInput>,
): Promise<ActionResult<CalendarEventRow>> {
  const context = await getSessionFamilyContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("family_id", context.data.familyId)
    .maybeSingle();

  if (existingError) {
    return { data: null, error: existingError.message };
  }

  if (!existing) {
    return { data: null, error: "Event not found" };
  }

  const nextTitle = payload.title !== undefined ? payload.title.trim() : existing.title;
  if (!nextTitle) {
    return { data: null, error: "Event title is required" };
  }

  const nextIsAllDay = payload.is_all_day ?? existing.is_all_day;
  const nextStartsAt = payload.starts_at ?? existing.starts_at;
  const nextEndsAt = payload.ends_at ?? existing.ends_at;
  const range = normalizeEventRange(nextStartsAt, nextEndsAt, nextIsAllDay);
  if (range.error || !range.data) {
    return { data: null, error: range.error ?? "Invalid event range" };
  }

  const updateData: Record<string, unknown> = {
    title: nextTitle,
    starts_at: range.data.startsAtIso,
    ends_at: range.data.endsAtIso,
    is_all_day: nextIsAllDay,
  };

  if (payload.description !== undefined) {
    updateData.description = payload.description?.trim() || null;
  }

  if (payload.location !== undefined) {
    updateData.location = payload.location?.trim() || null;
  }

  const { data, error } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", eventId)
    .eq("family_id", context.data.familyId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { data: data as CalendarEventRow, error: null };
}

export async function deleteEventAction(eventId: string): Promise<ActionResult<{ id: string }>> {
  const context = await getSessionFamilyContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("family_id", context.data.familyId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { data: { id: String(data.id) }, error: null };
}
