"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTransactionAction } from "@/lib/actions/finances";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TransactionRow = {
  id: string;
  account_id: string;
  category_id: string;
  amount: string;
  kind: "income" | "expense";
  title: string;
  note: string | null;
  transaction_date: string;
};

type AccountOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type TransactionListProps = {
  transactions: TransactionRow[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  canEdit?: boolean;
};

const formatMoney = (value: string, kind: "income" | "expense"): string => {
  const amount = Number(value || 0);
  const sign = kind === "income" ? "+" : "-";

  return `${sign}${new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

export function TransactionList({ transactions, accounts, categories, canEdit = true }: TransactionListProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const accountMap = new Map(accounts.map((account) => [account.id, account.name]));
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  if (transactions.length === 0) {
    return (
      <Card className="grid justify-items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-10 text-center">
        <p className="text-base font-medium text-white">Пока нет транзакций</p>
        <p className="text-sm text-white/40">Добавь первый доход или расход, чтобы видеть сводку за месяц.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {transactions.map((transaction) => (
        <Card
          key={transaction.id}
          className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{transaction.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/35">
                <span>{transaction.transaction_date}</span>
                <span>·</span>
                <span>{categoryMap.get(transaction.category_id) ?? "Категория"}</span>
                <span>·</span>
                <span>{accountMap.get(transaction.account_id) ?? "Счёт"}</span>
              </div>
              {transaction.note ? <p className="mt-2 text-sm text-white/50">{transaction.note}</p> : null}
            </div>

            <div className="flex items-center gap-3">
              <p className={`text-sm font-semibold ${transaction.kind === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                {formatMoney(transaction.amount, transaction.kind)}
              </p>
              <Button
                size="icon"
                variant="ghost"
                disabled={!canEdit || isPending}
                title={!canEdit ? "Только чтение" : undefined}
                onClick={() => {
                  if (!canEdit) {
                    toast.error("Недостаточно прав для редактирования");
                    return;
                  }

                  startTransition(async () => {
                    const result = await deleteTransactionAction(transaction.id);
                    if (result.error) {
                      toast.error(result.error);
                      return;
                    }

                    toast.success("Транзакция удалена");
                    router.refresh();
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
