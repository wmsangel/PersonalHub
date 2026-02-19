import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "../env";
import { checkSupabaseHealth } from "./shared";

const setCookieSafely = (
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  name: string,
  value: string,
  options: CookieOptions,
) => {
  try {
    cookieStore.set(name, value, options);
  } catch {
    // Server Components cannot always mutate cookies.
  }
};

export const getSupabaseServerClient = async (): Promise<SupabaseClient> => {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookieSafely(cookieStore, name, value, options);
        });
      },
    },
  });
};

export const serverSupabaseHealthcheck = checkSupabaseHealth;
