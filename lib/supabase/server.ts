import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Polyfill global WebSocket for Node 20 environments (like Hostinger)
// where native WebSocket is only present in Node 22+
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as unknown as Record<string, unknown>).WebSocket = class NodeWebSocketPolyfill {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    readonly readyState = 1;
    onopen: ((event: unknown) => void) | null = null;
    onclose: ((event: unknown) => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    onmessage: ((event: unknown) => void) | null = null;
    close() {}
    send() {}
  };
}

export async function createClient() {
  const cookieStore = await cookies();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const rawKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY
  )?.trim();

  // If env variables are not yet configured in Hostinger, use safe placeholder
  // so the application renders public pages without throwing a 500 error!
  const supabaseUrl = rawUrl && rawUrl.startsWith("http") ? rawUrl : "https://placeholder.supabase.co";
  const supabaseKey = rawKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_sams_edutech_key";

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
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SECRET
  )?.trim();

  if (serviceRoleKey && rawUrl && rawUrl.startsWith("http")) {
    return createSupabaseClient(rawUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return createClient();
}
