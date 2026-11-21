import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/lib/crypto";
import { getUpiPayments, getUpiConfig } from "@/lib/payments";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
  }

  try {
    const [payments, config] = await Promise.all([getUpiPayments(), getUpiConfig()]);
    return NextResponse.json({ success: true, payments, config });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching payments";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
