import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitUpiPayment } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to enroll." }, { status: 401 });
    }

    const body = await request.json();
    const { course_id, course_title, amount, utr_number, sender_upi_id, screenshot_url, student_name, student_phone } = body;

    if (!course_id || !course_title || !amount || !utr_number) {
      return NextResponse.json(
        { error: "Course details, payment amount, and 12-digit UTR number are required." },
        { status: 400 }
      );
    }

    const resolvedStudentName =
      student_name ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "Student";

    const resolvedStudentPhone =
      student_phone || (user.user_metadata?.phone_number as string) || null;

    const result = await submitUpiPayment({
      user_id: user.id,
      student_name: resolvedStudentName,
      student_email: user.email || "",
      student_phone: resolvedStudentPhone,
      course_id,
      course_title,
      amount: Number(amount),
      utr_number: String(utr_number),
      sender_upi_id: sender_upi_id ? String(sender_upi_id) : null,
      screenshot_url: screenshot_url ? String(screenshot_url) : null,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.enrollment_created
        ? "Payment registered! Your 12-digit UTR was recorded and course enrollment is active."
        : "Payment submitted successfully! Your 12-digit UTR is under verification. Course will unlock shortly.",
      payment: result.payment,
      enrollment_created: result.enrollment_created,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error processing payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
