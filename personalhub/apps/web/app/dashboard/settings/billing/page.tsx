import { redirect } from "next/navigation";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createCheckoutSessionAction, createPortalSessionAction } from "@/lib/actions/billing";
import { NoFamilyState } from "@/components/layout/NoFamilyState";

type BillingPlan = {
  id: "free" | "premium" | "family_plus";
  name: string;
  price: number;
  popular?: boolean;
  features: string[];
};

const plans: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: ["До 4 участников", "Задачи и покупки", "Заметки", "Список покупок"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 499,
    popular: true,
    features: ["До 8 участников", "Все модули", "Календарь", "Финансы", "Вишлисты"],
  },
  {
    id: "family_plus",
    name: "Family+",
    price: 799,
    features: ["Неограниченно участников", "Документы", "Приоритетная поддержка", "История 5 лет"],
  },
];

type PlanId = (typeof plans)[number]["id"];

export default async function BillingPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: familyMember } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!familyMember) {
    return <NoFamilyState title="Биллинг недоступен без семьи" />;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, stripe_customer_id, status, current_period_end")
    .eq("family_id", familyMember.family_id)
    .maybeSingle();

  const currentPlan = (subscription?.plan ?? "free") as PlanId;
  const hasSubscription = Boolean(subscription?.stripe_customer_id);

  return (
    <section className="grid gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-indigo-500/18 bg-indigo-500/10">
            <CreditCard className="h-6 w-6 text-indigo-300" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/34">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              рост продукта
            </div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">Подписка</h1>
            <p className="mt-1 text-sm text-white/42">Управляйте тарифом и оплатой вашего семейного пространства.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "surface-panel-soft relative overflow-hidden rounded-[1.5rem] p-6 transition-all duration-200 hover:border-white/12",
              plan.popular && "border-indigo-500/30 bg-indigo-500/[0.04]",
              currentPlan === plan.id && "border-emerald-500/25 bg-emerald-500/[0.03]",
            )}
          >
            {/* Top accent */}
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
                plan.popular && "via-indigo-400/50",
                !plan.popular && currentPlan === plan.id && "via-emerald-400/40",
                !plan.popular && currentPlan !== plan.id && "via-white/15",
              )}
            />

            {plan.popular && (
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-indigo-300">
                <Sparkles className="h-3 w-3" />
                Популярный
              </div>
            )}

            {currentPlan === plan.id && !plan.popular && (
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-300">
                <Check className="h-3 w-3" />
                Текущий
              </div>
            )}

            <div className="mb-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{plan.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold leading-none text-white">Бесплатно</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold leading-none text-white">{plan.price} ₽</span>
                    <span className="text-sm text-white/40">/мес</span>
                  </>
                )}
              </div>
            </div>

            <ul className="my-6 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span className="text-white/65">{feature}</span>
                </li>
              ))}
            </ul>

            {currentPlan === plan.id ? (
              <Button variant="outline" disabled className="w-full">
                Текущий план
              </Button>
            ) : plan.id === "free" ? (
              <Button variant="ghost" disabled className="w-full text-white/38">
                Нельзя вернуться на Free
              </Button>
            ) : (
              <form action={createCheckoutSessionAction.bind(null, plan.id)}>
                <Button type="submit" className="w-full">
                  Перейти на {plan.name}
                </Button>
              </form>
            )}
          </div>
        ))}
      </div>

      {hasSubscription && (
        <Card className="p-5 sm:p-6">
          <h3 className="mb-1 text-sm font-semibold text-white">Управление подпиской</h3>
          <p className="mb-4 text-xs leading-5 text-white/42">
            Обновите платёжные данные, просмотрите историю или отмените подписку через Stripe Customer Portal.
          </p>
          <form action={createPortalSessionAction}>
            <Button type="submit" variant="outline">
              Открыть Stripe Portal
            </Button>
          </form>
        </Card>
      )}
    </section>
  );
}
