import { createClient } from "@/lib/supabase/server";
import { CourseCatalog } from "@/components/course-catalog";
import { COURSES } from "@/lib/courses";
import type { Course } from "@/lib/types";

export default async function CoursesPage() {
  let courses: Course[] | null = null;
  let enrolledIds: string[] = [];

  try {
    const supabase = await createClient();
    const [{ data: dbCourses }, { data: { user } }] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: true }),
      supabase.auth.getUser(),
    ]);
    courses = (dbCourses as Course[]) ?? null;

    if (user) {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id);
      enrolledIds = (enrollments ?? []).map((item) => item.course_id);
    }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    console.warn("Could not query courses or user enrollments from Supabase:", err);
  }

  // Ensure canonical courses are always present and enriched
  const coursesMap = new Map<string, Course>();
  for (const c of COURSES) {
    coursesMap.set(c.slug, c);
  }
  if (courses && courses.length) {
    for (const c of courses as Course[]) {
      coursesMap.set(c.slug, { ...coursesMap.get(c.slug), ...c });
    }
  }
  const typedCourses = Array.from(coursesMap.values());

  return (
    <>
      <header className="page-head">
        <div className="container">
          <span className="eyebrow">Course catalog</span>
          <h1>Choose your next skill.</h1>
          <p>Search the catalog, compare learning effort, and enroll when the course fits your plan.</p>
        </div>
      </header>
      <main className="section">
        <div className="container">
          <CourseCatalog courses={typedCourses} enrolledIds={enrolledIds} />
        </div>
      </main>
    </>
  );
}
