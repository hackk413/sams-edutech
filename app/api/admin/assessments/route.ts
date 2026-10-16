import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/lib/crypto";
import {
  getWeeklyAssessments,
  createWeeklyAssessment,
  updateWeeklyAssessment,
  deleteWeeklyAssessment,
} from "@/lib/assessments";

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  return verifyAdminSessionToken(token);
}

export async function GET() {
  const assessments = await getWeeklyAssessments(false);
  return NextResponse.json({ assessments });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      week_number,
      course_id,
      course_title,
      title,
      slug,
      description,
      objectives,
      deliverables,
      due_date,
      max_points,
      passing_points,
      difficulty,
      starter_repo_url,
    } = body;

    if (!title || !description || !due_date) {
      return NextResponse.json({ error: "Missing required assessment fields" }, { status: 400 });
    }

    const created = await createWeeklyAssessment({
      week_number: Number(week_number) || 1,
      course_id: course_id || "all",
      course_title: course_title || "Universal Cohort Track",
      title: title.trim(),
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: description.trim(),
      objectives: Array.isArray(objectives) ? objectives : [],
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      due_date: new Date(due_date).toISOString(),
      max_points: Number(max_points) || 100,
      passing_points: Number(passing_points) || 60,
      difficulty: difficulty || "Intermediate",
      status: "published",
      starter_repo_url: starter_repo_url?.trim() || null,
    });

    return NextResponse.json({ success: true, assessment: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating assessment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Missing assessment id" }, { status: 400 });

    const updated = await updateWeeklyAssessment(id, updates);
    if (!updated) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

    return NextResponse.json({ success: true, assessment: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating assessment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing assessment id" }, { status: 400 });

    await deleteWeeklyAssessment(id);
    return NextResponse.json({ success: true, message: "Assessment deleted" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting assessment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
