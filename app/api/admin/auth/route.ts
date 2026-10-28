import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminPasskey, createAdminSessionToken, verifyAdminSessionToken } from "@/lib/crypto";
import { logAdminAction } from "@/lib/assessments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passkey } = body;

    if (!passkey || !verifyAdminPasskey(passkey)) {
      await logAdminAction("FAILED_ADMIN_LOGIN", "unknown", "Unauthorized access attempt to admin console", "security");
      return NextResponse.json({ error: "Invalid admin authorization passkey." }, { status: 401 });
    }

    const token = createAdminSessionToken("admin_master");
    const cookieStore = await cookies();
    cookieStore.set("sams_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days persistent admin session
      path: "/",
    });

    await logAdminAction("ADMIN_LOGIN_SUCCESS", "admin_master", "Admin successfully authenticated with secure key", "info");
    return NextResponse.json({ success: true, message: "Admin access granted" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  const isValid = verifyAdminSessionToken(token);
  return NextResponse.json({ authenticated: isValid });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("sams_admin_session");
  return NextResponse.json({ success: true, message: "Admin session ended" });
}
