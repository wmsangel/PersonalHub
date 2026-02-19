import { env } from "../env";

const defaultHeaders = {
  apikey: env.supabaseAnonKey,
  Authorization: `Bearer ${env.supabaseAnonKey}`,
};

export const checkSupabaseHealth = async (): Promise<boolean> => {
  const response = await fetch(`${env.supabaseUrl}/auth/v1/health`, {
    cache: "no-store",
    headers: defaultHeaders,
  });

  return response.ok;
};
