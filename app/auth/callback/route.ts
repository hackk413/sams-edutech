import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";
import { recordRealStudent } from "@/lib/assessments";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const supabase = await createClient();
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      recordRealStudent({
        id: data.user.id,
        full_name: (data.user.user_metadata?.full_name as string) || data.user.email?.split("@")[0] || "Student",
        email: data.user.email || "",
        phone_number: (data.user.user_metadata?.phone_number as string) || null,
        avatar_url: (data.user.user_metadata?.avatar_url as string) || null,
      });
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(next)}&error=auth_callback`, url.origin));
}
