import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        maxAge: ONE_YEAR_SECONDS,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              maxAge: ONE_YEAR_SECONDS,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              ...options,
            })
          );
        },
      },
    },
  );

  // Calling getUser() validates and auto-refreshes expired auth tokens
  try {
    await supabase.auth.getUser();
  } catch {
    // Graceful fallback for offline/cold start
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
