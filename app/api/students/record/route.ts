import { NextResponse, type NextRequest } from "next/server";
import { recordRealStudent } from "@/lib/assessments";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, full_name, email, phone_number, avatar_url, username, bio } = body;

    if (!id || !email) {
      return NextResponse.json({ error: "id and email are required" }, { status: 400 });
    }

    // 1. Record in local cache
    recordRealStudent({
      id,
      full_name: full_name || email.split("@")[0],
      email,
      phone_number: phone_number || null,
      username: username || email.split("@")[0],
      bio: bio || null,
      avatar_url: avatar_url || null,
    });

    // 2. Sync to Supabase profiles table via admin client
    try {
      const adminClient = await createAdminClient();
      await adminClient.from("profiles").upsert({
        id,
        full_name: full_name || email.split("@")[0],
        email,
        phone_number: phone_number || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not upsert profile via admin client:", e);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error recording student";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
