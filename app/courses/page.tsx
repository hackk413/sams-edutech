import { createClient } from "@/lib/supabase/server";
import { CourseCatalog } from "@/components/course-catalog";
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
  const typedCourses = (courses ?? []) as Course[];

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
