"use server";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Plan = "premium" | "family_plus";

const getAppUrl = (): string => env.appUrl ?? "http://localhost:3000";

const requireAdminFamilyMembership = async (userId: string) => {
  const supabase = await getSupabaseServerClient();
  const { data: familyMember, error: familyMemberError } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (familyMemberError) {
    throw new Error(familyMemberError.message);
  }

  if (!familyMember) {
    throw new Error("No family found.");
  }

  if (familyMember.role !== "admin") {
    throw new Error("Only family admin can manage billing.");
  }

  return familyMember;
};

export async function createCheckoutSessionAction(plan: Plan): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const familyMember = await requireAdminFamilyMembership(user.id);
  const stripe = getStripeClient();

  const priceId = plan === "premium" ? env.stripePremiumPriceId : env.stripeFamilyPlusPriceId;
  if (!priceId) {
    throw new Error("Stripe price id is missing in environment.");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${getAppUrl()}/dashboard/settings/billing?success=true`,
    cancel_url: `${getAppUrl()}/dashboard/settings/billing?cancelled=true`,
    metadata: {
      family_id: familyMember.family_id,
      plan,
    },
  });

  if (!session.url) {
    throw new Error("Stripe checkout session has no redirect URL.");
  }

  redirect(session.url);
}

export async function createPortalSessionAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const familyMember = await requireAdminFamilyMembership(user.id);
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("family_id", familyMember.family_id)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  if (!subscription?.stripe_customer_id) {
    throw new Error("No paid subscription found.");
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${getAppUrl()}/dashboard/settings/billing`,
  });

  redirect(session.url);
}
