import { TrendingDown, TrendingUp, Wallet } from "lucide-react";

type SummaryCardsProps = {
  income: number;
  expense: number;
  balance: number;
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export function SummaryCards({ income, expense, balance }: SummaryCardsProps) {
  const totalFlow = Math.max(income + expense, 1);
  const incomeWidth = Math.max(6, Math.round((income / totalFlow) * 100));
  const expenseWidth = Math.max(6, Math.round((expense / totalFlow) * 100));

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="surface-panel relative overflow-hidden rounded-[1.4rem] p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%)]" />
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/34">Доходы</p>
            <p className="text-[1.85rem] font-semibold tracking-[-0.04em] text-emerald-300">+{formatMoney(income)}</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${incomeWidth}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/30">Доля в месячном потоке: {incomeWidth}%</p>
      </div>

      <div className="surface-panel relative overflow-hidden rounded-[1.4rem] p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.16),transparent_34%)]" />
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
            <TrendingDown className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/34">Расходы</p>
            <p className="text-[1.85rem] font-semibold tracking-[-0.04em] text-rose-300">-{formatMoney(expense)}</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-300"
            style={{ width: `${expenseWidth}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/30">Доля в месячном потоке: {expenseWidth}%</p>
      </div>

      <div className="surface-panel relative overflow-hidden rounded-[1.4rem] p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%)]" />
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
            <Wallet className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/34">Баланс</p>
            <p className={`text-[1.85rem] font-semibold tracking-[-0.04em] ${balance >= 0 ? "text-cyan-300" : "text-rose-300"}`}>
              {balance >= 0 ? "+" : ""}
              {formatMoney(balance)}
            </p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              balance >= 0 ? "bg-gradient-to-r from-cyan-500 to-indigo-500" : "bg-gradient-to-r from-rose-500 to-pink-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(8, Math.round((Math.abs(balance) / totalFlow) * 100)))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/30">{balance >= 0 ? "Профицит месяца" : "Дефицит месяца"}</p>
      </div>
    </div>
  );
}
