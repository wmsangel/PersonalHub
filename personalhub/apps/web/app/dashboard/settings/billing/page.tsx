import { redirect } from "next/navigation";
import { Check } from "lucide-react";
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
    <div className="mx-auto max-w-6xl p-2 md:p-4">
      <h1 className="text-2xl font-semibold text-white mb-2">Подписка</h1>
      <p className="text-sm text-white/50 mb-8">Управляйте тарифом и оплатой вашего семейного пространства.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative border-white/[0.08] bg-white/[0.03]",
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
        <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h3 className="mb-2 text-sm font-medium text-white">Управление подпиской</h3>
          <p className="mb-4 text-xs text-white/50">
            Обновите платежные данные, просмотрите историю или отмените подписку в Stripe Customer Portal.
          </p>
          <form action={createPortalSessionAction}>
            <Button type="submit" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Открыть Stripe Portal
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
