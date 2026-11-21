import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/lib/crypto";
import { saveUpiConfig } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { upi_id, payee_name, auto_enroll, instructions, active, qr_image_url } = body;

    const updated = await saveUpiConfig({
      ...(upi_id !== undefined && { upi_id: String(upi_id).trim() }),
      ...(payee_name !== undefined && { payee_name: String(payee_name).trim() }),
      ...(auto_enroll !== undefined && { auto_enroll: Boolean(auto_enroll) }),
      ...(instructions !== undefined && { instructions: String(instructions) }),
      ...(active !== undefined && { active: Boolean(active) }),
      ...(qr_image_url !== undefined && { qr_image_url: String(qr_image_url) }),
    });

    return NextResponse.json({
      success: true,
      message: "UPI Gateway settings saved successfully.",
      config: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error saving UPI settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
