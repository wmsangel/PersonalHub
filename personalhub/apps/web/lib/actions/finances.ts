"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

type AccountType = "cash" | "card" | "deposit" | "savings";
type TransactionKind = "income" | "expense";

type FinanceContext = {
  userId: string;
  familyId: string;
  canView: boolean;
  canEdit: boolean;
};

type AccountRow = {
  id: string;
  family_id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

type TransactionRow = {
  id: string;
  family_id: string;
  account_id: string;
  category_id: string;
  created_by: string | null;
  amount: string;
  kind: TransactionKind;
  title: string;
  note: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
};

type CreateAccountPayload = {
  name: string;
  type?: AccountType;
  currency?: string;
  balance?: number;
  is_archived?: boolean;
};

type UpdateAccountPayload = Partial<CreateAccountPayload>;

type TransactionFilters = {
  from?: string;
  to?: string;
  kind?: TransactionKind | "all";
  categoryId?: string;
  accountId?: string;
  limit?: number;
};

type CreateTransactionPayload = {
  account_id: string;
  category_id: string;
  amount: number;
  kind: TransactionKind;
  title: string;
  note?: string;
  transaction_date?: string;
};

const parseAmount = (value: string | number | null | undefined): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10);

const getMonthRange = (month?: string): ActionResult<{ from: string; to: string }> => {
  if (!month) {
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    return { data: { from: toIsoDate(from), to: toIsoDate(to) }, error: null };
  }

  const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
  if (!monthMatch) {
    return { data: null, error: "Invalid month format. Use YYYY-MM" };
  }

  const year = Number(monthMatch[1]);
  const monthIndex = Number(monthMatch[2]) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return { data: null, error: "Invalid month value" };
  }

  const from = new Date(Date.UTC(year, monthIndex, 1));
  const to = new Date(Date.UTC(year, monthIndex + 1, 1));

  return { data: { from: toIsoDate(from), to: toIsoDate(to) }, error: null };
};

const getFinanceContext = async (): Promise<ActionResult<FinanceContext>> => {
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
    .eq("module", "finances")
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
      canView: permission?.can_view ?? isAdmin,
      canEdit: permission?.can_edit ?? isAdmin,
    },
    error: null,
  };
};

export async function getAccountsAction(): Promise<ActionResult<AccountRow[]>> {
  const context = await getFinanceContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canView) {
    return { data: null, error: "Access denied: finances view permission required" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("family_id", context.data.familyId)
    .order("is_archived", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as AccountRow[], error: null };
}

export async function createAccountAction(payload: CreateAccountPayload): Promise<ActionResult<AccountRow>> {
  const context = await getFinanceContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canEdit) {
    return { data: null, error: "Access denied: finances edit permission required" };
  }

  const name = payload.name.trim();
  if (!name) {
    return { data: null, error: "Account name is required" };
  }

  const currency = (payload.currency?.trim().toUpperCase() ?? "RUB").slice(0, 3);
  if (currency.length !== 3) {
    return { data: null, error: "Currency must be a 3-letter code" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      family_id: context.data.familyId,
      name,
      type: payload.type ?? "card",
      currency,
      balance: payload.balance ?? 0,
      is_archived: payload.is_archived ?? false,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/finances");
  return { data: data as AccountRow, error: null };
}

export async function updateAccountAction(
  accountId: string,
  payload: UpdateAccountPayload,
): Promise<ActionResult<AccountRow>> {
  const context = await getFinanceContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canEdit) {
    return { data: null, error: "Access denied: finances edit permission required" };
  }

  const updateData: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (!name) {
      return { data: null, error: "Account name cannot be empty" };
    }

    updateData.name = name;
  }

  if (payload.type !== undefined) {
    updateData.type = payload.type;
  }

  if (payload.currency !== undefined) {
    const currency = payload.currency.trim().toUpperCase().slice(0, 3);
    if (currency.length !== 3) {
      return { data: null, error: "Currency must be a 3-letter code" };
    }

    updateData.currency = currency;
  }

  if (payload.balance !== undefined) {
    updateData.balance = payload.balance;
  }

  if (payload.is_archived !== undefined) {
    updateData.is_archived = payload.is_archived;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .update(updateData)
    .eq("id", accountId)
    .eq("family_id", context.data.familyId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/finances");
  return { data: data as AccountRow, error: null };
}

export async function getTransactionsAction(
  params: TransactionFilters = {},
): Promise<ActionResult<TransactionRow[]>> {
  const context = await getFinanceContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canView) {
    return { data: null, error: "Access denied: finances view permission required" };
  }

  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("family_id", context.data.familyId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.kind && params.kind !== "all") {
    query = query.eq("kind", params.kind);
  }

  if (params.categoryId) {
    query = query.eq("category_id", params.categoryId);
  }

  if (params.accountId) {
    query = query.eq("account_id", params.accountId);
  }

  if (params.from) {
    query = query.gte("transaction_date", params.from);
  }

  if (params.to) {
    query = query.lte("transaction_date", params.to);
  }

  if (params.limit && params.limit > 0) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as TransactionRow[], error: null };
}

export async function createTransactionAction(
  payload: CreateTransactionPayload,
): Promise<ActionResult<TransactionRow>> {
  const context = await getFinanceContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canEdit) {
    return { data: null, error: "Access denied: finances edit permission required" };
  }

  const title = payload.title.trim();
  if (!title) {
    return { data: null, error: "Transaction title is required" };
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    return { data: null, error: "Amount must be greater than 0" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      family_id: context.data.familyId,
      account_id: payload.account_id,
      category_id: payload.category_id,
      created_by: context.data.userId,
      amount: payload.amount,
      kind: payload.kind,
      title,
      note: payload.note?.trim() || null,
      transaction_date: payload.transaction_date ?? new Date().toISOString().slice(0, 10),
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/finances");
  return { data: data as TransactionRow, error: null };
}

export async function deleteTransactionAction(transactionId: string): Promise<ActionResult<{ id: string }>> {
  const context = await getFinanceContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canEdit) {
    return { data: null, error: "Access denied: finances edit permission required" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("family_id", context.data.familyId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/dashboard/finances");
  return { data: { id: String(data.id) }, error: null };
}

export async function getFinanceSummaryAction({
  month,
}: {
  month?: string;
}): Promise<ActionResult<{ income: number; expense: number; balance: number }>> {
  const context = await getFinanceContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "Failed to read session" };
  }

  if (!context.data.canView) {
    return { data: null, error: "Access denied: finances view permission required" };
  }

  const monthRange = getMonthRange(month);
  if (monthRange.error || !monthRange.data) {
    return { data: null, error: monthRange.error ?? "Invalid month" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, kind")
    .eq("family_id", context.data.familyId)
    .gte("transaction_date", monthRange.data.from)
    .lt("transaction_date", monthRange.data.to);

  if (error) {
    return { data: null, error: error.message };
  }

  const totals = (data ?? []).reduce(
    (acc, row) => {
      const amount = parseAmount(row.amount);
      if (row.kind === "income") {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }

      return acc;
    },
    { income: 0, expense: 0 },
  );

  return {
    data: {
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
    },
    error: null,
  };
}
