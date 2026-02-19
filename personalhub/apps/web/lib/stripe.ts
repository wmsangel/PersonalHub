import Stripe from "stripe";
import { env } from "./env";

let stripeClient: Stripe | null = null;

const requireStripeSecret = (): string => {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required for billing actions.");
  }

  return env.stripeSecretKey;
};

export const getStripeClient = (): Stripe => {
  if (!stripeClient) {
    stripeClient = new Stripe(requireStripeSecret(), {
      apiVersion: "2026-01-28.clover",
    });
  }

  return stripeClient;
};
