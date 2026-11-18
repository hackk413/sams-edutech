import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookieOptions: {
        maxAge: ONE_YEAR_SECONDS,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                maxAge: ONE_YEAR_SECONDS,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                ...options,
              })
            );
          } catch {
            // Server Components cannot always mutate cookies. Proxy handles refreshes.
          }
        },
      },
    },
  );
}

/**
 * Privileged client for server-side admin operations.
 * Uses SUPABASE_SERVICE_ROLE_KEY if set, otherwise falls back to standard client.
 */
export async function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return createClient();
}
