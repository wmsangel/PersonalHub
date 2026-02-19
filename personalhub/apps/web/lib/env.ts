type RequiredEnvKey = "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
type OptionalEnvKey =
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "NEXT_PUBLIC_APP_URL"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  | "STRIPE_PREMIUM_PRICE_ID"
  | "STRIPE_FAMILY_PLUS_PRICE_ID";

const getRequiredPublicEnv = (key: RequiredEnvKey, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getOptionalEnv = (key: OptionalEnvKey): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

export const env = {
  supabaseUrl: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseServiceRoleKey: getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  appUrl: getOptionalEnv("NEXT_PUBLIC_APP_URL"),
  stripeSecretKey: getOptionalEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: getOptionalEnv("STRIPE_WEBHOOK_SECRET"),
  stripePublishableKey: getOptionalEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  stripePremiumPriceId: getOptionalEnv("STRIPE_PREMIUM_PRICE_ID"),
  stripeFamilyPlusPriceId: getOptionalEnv("STRIPE_FAMILY_PLUS_PRICE_ID"),
};
