import { NextResponse, type NextRequest } from "next/server";
import { getUpiPayments, verifyUpiPayment } from "@/lib/payments";
import { logAdminAction } from "@/lib/assessments";

/**
 * Automated Bank / Merchant UPI Webhook Endpoint
 * Compatible with PhonePe Business, Paytm for Business, BharatPe, and SMS-Forwarder automation.
 *
 * Incoming payload:
 * {
 *   "utr": "432109876543",
 *   "amount": 23999,
 *   "status": "SUCCESS",
 *   "secret": "ADMIN_SECRET_KEY" // or via Authorization header
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const body = await request.json().catch(() => ({}));
    const { utr, amount, status, secret } = body;

    const expectedSecret = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_ACCESS_KEY;
    const providedSecret = authHeader.replace(/^Bearer\s+/i, "") || secret;

    // Secure webhook verification
    if (expectedSecret && providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook signature or secret" }, { status: 401 });
    }

    if (!utr || typeof utr !== "string") {
      return NextResponse.json({ error: "Missing or invalid 12-digit UTR in payload" }, { status: 400 });
    }

    const cleanUtr = utr.trim().replace(/\s+/g, "");
    if (!/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json({ error: "UTR must be a 12-digit numeric reference" }, { status: 400 });
    }

    // Check if status is successful credit
    const normalizedStatus = String(status || "").toUpperCase();
    if (normalizedStatus && normalizedStatus !== "SUCCESS" && normalizedStatus !== "COMPLETED") {
      return NextResponse.json(
        { message: `Ignored webhook notification with non-success status: ${normalizedStatus}` },
        { status: 200 }
      );
    }

    const payments = await getUpiPayments();
    const target = payments.find((p) => p.utr_number === cleanUtr);

    if (!target) {
      // Payment not yet registered by student; log receipt in audit trail
      await logAdminAction(
        "UNMATCHED_BANK_CREDIT",
        "webhook",
        `Bank credit received for UTR ${cleanUtr} (₹${amount || "N/A"}), awaiting student checkout match.`
      );
      return NextResponse.json(
        { success: true, message: `Credit logged for UTR ${cleanUtr}. Awaiting student submission.` },
        { status: 200 }
      );
    }

    if (target.status === "verified") {
      return NextResponse.json(
        { success: true, message: `UTR ${cleanUtr} was already verified.` },
        { status: 200 }
      );
    }

    // Auto-verify payment & unlock course
    const result = await verifyUpiPayment(
      target.id,
      "verify",
      `Automatically confirmed via bank webhook for ₹${amount || target.amount}`,
      "webhook-daemon"
    );

    return NextResponse.json({
      success: true,
      message: `Payment verified and course "${target.course_title}" unlocked for ${target.student_email}`,
      payment: result.payment,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error processing bank webhook";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
