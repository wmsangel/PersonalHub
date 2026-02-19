import Stripe from "stripe";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const resolveSubscriptionStatus = (status: Stripe.Subscription.Status) => {
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "trialing") return "trial";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
    return "cancelled";
  }

  return "expired";
};

export async function POST(req: Request) {
  if (!env.stripeWebhookSecret) {
    return Response.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const body = await req.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripeClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const familyId = session.metadata?.family_id;
      const plan = session.metadata?.plan as "premium" | "family_plus" | undefined;

      if (!familyId || !plan) {
        break;
      }

      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

      await supabase
        .from("subscriptions")
        .update({
          plan,
          status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .eq("family_id", familyId);

      await supabase
        .from("families")
        .update({ plan })
        .eq("id", familyId);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const firstItem = subscription.items.data[0];
      await supabase
        .from("subscriptions")
        .update({
          status: resolveSubscriptionStatus(subscription.status),
          current_period_start: firstItem?.current_period_start
            ? new Date(firstItem.current_period_start * 1000).toISOString()
            : null,
          current_period_end: firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: currentSub } = await supabase
        .from("subscriptions")
        .select("family_id")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "expired",
          cancel_at_period_end: false,
        })
        .eq("stripe_subscription_id", subscription.id);

      if (currentSub?.family_id) {
        await supabase
          .from("families")
          .update({ plan: "free" })
          .eq("id", currentSub.family_id);
      }
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
