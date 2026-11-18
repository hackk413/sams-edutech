import { createBrowserClient } from "@supabase/ssr";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      cookieOptions: {
        maxAge: ONE_YEAR_SECONDS,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    }
  );
}
