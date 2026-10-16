import { createClient } from "@/lib/supabase/server";
import { CourseCatalog } from "@/components/course-catalog";
import { COURSES } from "@/lib/courses";
import type { Course } from "@/lib/types";

export default async function CoursesPage() {
  const supabase = await createClient();
  const [{ data: courses }, { data: { user } }] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);
  let enrolledIds: string[] = [];
  if (user) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id);
    enrolledIds = (enrollments ?? []).map((item) => item.course_id);
  }

  // Ensure the 5 canonical courses are always present and enriched
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
