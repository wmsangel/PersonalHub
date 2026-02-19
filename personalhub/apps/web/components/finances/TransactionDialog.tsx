"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { createTransactionAction } from "@/lib/actions/finances";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AccountOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
  kind: "income" | "expense";
};

type TransactionDialogProps = {
  accounts: AccountOption[];
  categories: CategoryOption[];
  canEdit?: boolean;
};

export function TransactionDialog({ accounts, categories, canEdit = true }: TransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredCategories = useMemo(() => categories.filter((category) => category.kind === kind), [categories, kind]);
  const canCreate = canEdit && accounts.length > 0 && filteredCategories.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="finance-add-transaction-button" disabled={!canCreate} title={!canEdit ? "Только чтение" : undefined}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить транзакцию
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая транзакция</DialogTitle>
          <DialogDescription>Добавь доход или расход для семейного бюджета.</DialogDescription>
        </DialogHeader>

        <form
          id="finance-transaction-form"
          className="grid gap-4"
          action={(formData) => {
            if (!canCreate) {
              toast.error("Невозможно создать транзакцию");
              return;
            }

            startTransition(async () => {
              const title = String(formData.get("title") ?? "").trim();
              const amount = Number(formData.get("amount"));
              const accountId = String(formData.get("account_id") ?? "");
              const categoryId = String(formData.get("category_id") ?? "");
              const note = String(formData.get("note") ?? "").trim();
              const transactionDate = String(formData.get("transaction_date") ?? "");

              const result = await createTransactionAction({
                title,
                amount,
                kind,
                account_id: accountId,
                category_id: categoryId,
                note: note || undefined,
                transaction_date: transactionDate || undefined,
              });

              if (result.error) {
                toast.error(result.error);
                return;
              }

              toast.success("Транзакция создана");
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="kind">Тип</Label>
            <select
              id="kind"
              name="kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as "income" | "expense")}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Название</Label>
            <Input id="title" name="title" placeholder="Например: Продукты" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Сумма</Label>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account_id">Счёт</Label>
            <select id="account_id" name="account_id" required className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Выбери счёт</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category_id">Категория</Label>
            <select id="category_id" name="category_id" required className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">Выбери категорию</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transaction_date">Дата</Label>
            <Input id="transaction_date" name="transaction_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Комментарий</Label>
            <Textarea id="note" name="note" rows={3} />
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form="finance-transaction-form" disabled={isPending || !canCreate}>
            <Save className="mr-2 h-4 w-4" />
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
