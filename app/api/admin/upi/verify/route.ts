import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/lib/crypto";
import { verifyUpiPayment, verifyBulkUpiPayments } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { payment_id, payment_ids, action, admin_notes } = body;

    if (action !== "verify" && action !== "reject") {
      return NextResponse.json({ error: "Valid action ('verify' or 'reject') required." }, { status: 400 });
    }

    // ── Bulk Verification Mode ──
    if (Array.isArray(payment_ids) && payment_ids.length > 0) {
      const result = await verifyBulkUpiPayments(payment_ids, action, admin_notes, "Admin Faculty");
      return NextResponse.json({
        success: true,
        message: `${result.processed} payment(s) successfully ${action === "verify" ? "confirmed and course access unlocked" : "rejected"}!`,
        processed: result.processed,
        payments: result.payments,
      });
    }

    // ── Single Verification Mode ──
    if (!payment_id) {
      return NextResponse.json({ error: "payment_id or payment_ids array required." }, { status: 400 });
    }

    const result = await verifyUpiPayment(payment_id, action, admin_notes, "Admin Faculty");

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: action === "verify" ? "Payment verified and course access confirmed!" : "Payment rejected and access revoked.",
      payment: result.payment,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error verifying payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
