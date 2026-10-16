import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/lib/crypto";
import { gradeSubmission } from "@/lib/assessments";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { submission_id, score, grade, feedback, status, graded_by } = body;

    if (!submission_id || typeof score !== "number") {
      return NextResponse.json({ error: "Missing submission ID or score" }, { status: 400 });
    }

    const updated = await gradeSubmission(submission_id, {
      score,
      grade: grade || (score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "Pass"),
      feedback: feedback || "Solution reviewed and verified.",
      status: status || "graded",
      graded_by: graded_by || "Head Mentor",
    });

    if (!updated) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error grading submission";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
