import { redirect } from "next/navigation";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative p-1",
              plan.popular && "ring-2 ring-indigo-500/80",
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">Популярный</span>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-white">{plan.name}</CardTitle>
              <div className="mt-2 flex items-baseline gap-1">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold text-white">Бесплатно</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-white">{plan.price} ₽</span>
                    <span className="text-sm text-white/50">/месяц</span>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <ul className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-white/75">{feature}</span>
                  </li>
                ))}
              </ul>

              {currentPlan === plan.id ? (
                <Button variant="outline" disabled className="w-full border-white/20 text-white/70">
                  Текущий план
                </Button>
              ) : plan.id === "free" ? (
                <Button variant="ghost" disabled className="w-full text-white/50">
                  Нельзя вернуться на Free
                </Button>
              ) : (
                <form action={createCheckoutSessionAction.bind(null, plan.id)}>
                  <Button type="submit" className="w-full">
                    Перейти на {plan.name}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {hasSubscription && (
        <Card className="p-6">
          <h3 className="mb-2 text-sm font-medium text-white">Управление подпиской</h3>
          <p className="mb-4 text-xs text-white/50">
            Обновите платежные данные, просмотрите историю или отмените подписку в Stripe Customer Portal.
          </p>
          <form action={createPortalSessionAction}>
            <Button type="submit" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Открыть Stripe Portal
            </Button>
          </form>
        </Card>
      )}
    </section>
  );
}
