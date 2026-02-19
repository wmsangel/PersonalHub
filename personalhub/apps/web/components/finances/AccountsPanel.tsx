import { Landmark, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type AccountRow = {
  id: string;
  name: string;
  type: "cash" | "card" | "deposit" | "savings";
  currency: string;
  balance: string;
  is_archived: boolean;
};

type AccountsPanelProps = {
  accounts: AccountRow[];
};

const typeLabel: Record<AccountRow["type"], string> = {
  cash: "Наличные",
  card: "Карта",
  deposit: "Депозит",
  savings: "Накопления",
};

const formatMoney = (value: string, currency: string): string =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency || "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export function AccountsPanel({ accounts }: AccountsPanelProps) {
  return (
    <Card className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Счета</h2>
          <p className="text-sm text-white/40">Текущие остатки по семейным счетам.</p>
        </div>
        <WalletCards className="h-5 w-5 text-white/45" />
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-white/40">Пока нет счетов. Добавление счетов будет доступно в следующем шаге.</p>
      ) : (
        <div className="grid gap-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between gap-3 rounded-md border border-white/[0.07] bg-white/[0.02] p-3
                         transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-white/45" />
                  <p className="truncate font-medium text-white">{account.name}</p>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/35">
                  <span>{typeLabel[account.type]}</span>
                  {account.is_archived ? <Badge variant="outline">архив</Badge> : null}
                </div>
              </div>
              <p className="whitespace-nowrap text-sm font-semibold text-white">{formatMoney(account.balance, account.currency)}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
