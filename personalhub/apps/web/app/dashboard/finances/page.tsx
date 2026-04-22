import { notFound, redirect } from "next/navigation";
import { Sparkles, Wallet } from "lucide-react";
import { TransactionDialog } from "@/components/finances/TransactionDialog";
import { TransactionList } from "@/components/finances/TransactionList";
import { AccountsPanel } from "@/components/finances/AccountsPanel";
import { SummaryCards } from "@/components/finances/SummaryCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NoFamilyState } from "@/components/layout/NoFamilyState";
import { getAccountsAction, getFinanceSummaryAction, getTransactionsAction } from "@/lib/actions/finances";
import { assertCanViewModule, canEditModule } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type CategoryRow = {
  id: string;
  family_id: string;
  name: string;
  kind: "income" | "expense";
  color: string;
  icon: string | null;
};

const readParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const asMonth = (value: string): string => (value.match(/^\d{4}-\d{2}$/) ? value : "");

export default async function FinancesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const from = readParam(params.from);
  const to = readParam(params.to);
  const kind = readParam(params.kind);
  const accountId = readParam(params.accountId);
  const categoryId = readParam(params.categoryId);
  const month = asMonth(readParam(params.month)) || new Date().toISOString().slice(0, 7);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const membership = await supabase
    .from("family_members")
    .select("id, family_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership.data) {
    return <NoFamilyState />;
  }

  const permission = await supabase
    .from("member_permissions")
    .select("can_view, can_edit")
    .eq("member_id", membership.data.id)
    .eq("module", "finances")
    .limit(1)
    .maybeSingle();

  const modulePermissions = {
    finances: {
      canView: permission.data?.can_view ?? membership.data.role === "admin",
      canEdit: permission.data?.can_edit ?? membership.data.role === "admin",
    },
  };

  try {
    assertCanViewModule(modulePermissions, "finances");
  } catch {
    notFound();
  }
  const canEditFinances = canEditModule(modulePermissions, "finances");

  const [accountsResult, transactionsResult, summaryResult, categoriesResult] = await Promise.all([
    getAccountsAction(),
    getTransactionsAction({
      from: from || undefined,
      to: to || undefined,
      kind: kind === "income" || kind === "expense" ? kind : "all",
      accountId: accountId || undefined,
      categoryId: categoryId || undefined,
    }),
    getFinanceSummaryAction({ month }),
    supabase
      .from("finance_categories")
      .select("id, family_id, name, kind, color, icon")
      .eq("family_id", membership.data.family_id)
      .order("is_system", { ascending: false })
      .order("name", { ascending: true }),
  ]);

  const pageError =
    accountsResult.error ??
    transactionsResult.error ??
    summaryResult.error ??
    categoriesResult.error?.message ??
    null;

  if (pageError) {
    return (
      <section className="grid gap-4">
        <h1 className="text-2xl font-semibold">Финансы</h1>
        <Card className="p-4 text-sm text-destructive">{pageError}</Card>
      </section>
    );
  }

  const accounts = accountsResult.data ?? [];
  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const transactions = transactionsResult.data ?? [];
  const summary = summaryResult.data ?? { income: 0, expense: 0, balance: 0 };

  return (
    <section className="grid gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-cyan-500/18 bg-cyan-500/10">
            <Wallet className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/34">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              семейный баланс
            </div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">Финансы</h1>
            <p className="mt-1 text-sm text-white/42">Счета, транзакции и спокойная сводка доходов и расходов семьи.</p>
          </div>
        </div>
        <TransactionDialog
          accounts={accounts.filter((account) => !account.is_archived).map((account) => ({ id: account.id, name: account.name }))}
          categories={categories.map((category) => ({ id: category.id, name: category.name, kind: category.kind }))}
          canEdit={canEditFinances}
        />
      </div>

      <SummaryCards income={summary.income} expense={summary.expense} balance={summary.balance} />

      <AccountsPanel
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          balance: account.balance,
          is_archived: account.is_archived,
        }))}
      />

      <Card className="p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-white">Фильтры транзакций</h2>
          <p className="mt-0.5 text-xs text-white/38">Сузьте список по периоду, типу и счёту</p>
        </div>
        <form className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6" method="get">
          <div className="grid gap-1.5">
            <label htmlFor="month" className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Месяц сводки
            </label>
            <input id="month" name="month" type="month" defaultValue={month} className="field-input" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="kind" className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Тип
            </label>
            <select id="kind" name="kind" defaultValue={kind || "all"} className="field-input">
              <option value="all">Все операции</option>
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="accountId" className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Счёт
            </label>
            <select id="accountId" name="accountId" defaultValue={accountId || "all"} className="field-input">
              <option value="all">Все счета</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="categoryId" className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Категория
            </label>
            <select id="categoryId" name="categoryId" defaultValue={categoryId || "all"} className="field-input">
              <option value="all">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="from" className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Период от
            </label>
            <input id="from" name="from" type="date" defaultValue={from} className="field-input" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="to" className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Период до
            </label>
            <input id="to" name="to" type="date" defaultValue={to} className="field-input" />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 md:col-span-3 lg:col-span-6">
            <Button type="submit" size="sm">Применить фильтры</Button>
            <Button asChild type="button" variant="outline" size="sm">
              <a href="/dashboard/finances">Сбросить</a>
            </Button>
          </div>
        </form>
      </Card>

      <TransactionList
        transactions={transactions.map((transaction) => ({
          id: transaction.id,
          account_id: transaction.account_id,
          category_id: transaction.category_id,
          amount: transaction.amount,
          kind: transaction.kind,
          title: transaction.title,
          note: transaction.note,
          transaction_date: transaction.transaction_date,
        }))}
        accounts={accounts.map((account) => ({ id: account.id, name: account.name }))}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        canEdit={canEditFinances}
      />
    </section>
  );
}
