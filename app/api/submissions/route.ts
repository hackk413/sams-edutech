import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitAssessment } from "@/lib/assessments";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      assessment_id,
      user_id,
      student_name,
      student_email,
      github_url,
      demo_url,
      notes,
    } = body;

    if (!assessment_id || !github_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure student ID matches authenticated user if signed in
    const effectiveUserId = user ? user.id : user_id || "anonymous-student";
    const effectiveEmail = user?.email || student_email || "student@samsedutech.in";
    const effectiveName = (user?.user_metadata?.full_name as string) || student_name || "Student";

    const submission = await submitAssessment({
      assessment_id,
      user_id: effectiveUserId,
      student_name: effectiveName,
      student_email: effectiveEmail,
      github_url,
      demo_url: demo_url || null,
      notes: notes || null,
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
