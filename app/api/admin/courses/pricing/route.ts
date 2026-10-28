import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/lib/crypto";
import {
  getDynamicCoursePricing,
  updateCoursePricing,
  getAllCourses,
} from "@/lib/courses-server";
import { logAdminAction } from "@/lib/assessments";
import { createAdminClient } from "@/lib/supabase/server";

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  return verifyAdminSessionToken(token);
}

export async function GET() {
  const pricing = getDynamicCoursePricing();
  const courses = getAllCourses();
  return NextResponse.json({ pricing, courses });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, price, original_price, discount_percent, active } = body;

    if (!slug) {
      return NextResponse.json({ error: "Course slug is required." }, { status: 400 });
    }

    const updated = updateCoursePricing(slug, {
      price: typeof price === "number" ? price : undefined,
      original_price: typeof original_price === "number" ? original_price : undefined,
      discount_percent: typeof discount_percent === "number" ? discount_percent : undefined,
      active: typeof active === "boolean" ? active : undefined,
    });

    // Sync to Supabase if connected
    try {
      const adminClient = await createAdminClient();
      await adminClient.from("courses").update({
        price: updated.price,
        original_price: updated.original_price,
        discount_percent: updated.discount_percent,
      }).eq("slug", slug);

      await adminClient.from("course_pricing").upsert({
        slug,
        price: updated.price,
        original_price: updated.original_price,
        discount_percent: updated.discount_percent,
        active: updated.active,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Local dynamic pricing guaranteed
    }

    await logAdminAction(
      "UPDATE_COURSE_PRICING",
      "admin",
      `Updated pricing for ${slug}: ₹${updated.price} (Original: ₹${updated.original_price}, Discount: ${updated.discount_percent}%)`,
      "info"
    );

    return NextResponse.json({ success: true, pricing: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating pricing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
