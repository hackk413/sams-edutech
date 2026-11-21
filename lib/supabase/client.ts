import { createBrowserClient } from "@supabase/ssr";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const rawKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY
  )?.trim();

  const supabaseUrl = rawUrl && rawUrl.startsWith("http") ? rawUrl : "https://placeholder.supabase.co";
  const supabaseKey = rawKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_sams_edutech_key";

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
