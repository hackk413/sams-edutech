import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayDate } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { HorizontalCourseTrack } from "@/components/horizontal-course-track";
import { RoyalCertificateCard } from "@/components/royal-certificate-card";
import { UserAvatar } from "@/components/user-avatar";
import { WeeklyAssessmentsTab } from "@/components/weekly-assessments-tab";
import { averageProgress, clampProgress, completedCourses, inProgressCourses, recommendedCourses } from "@/lib/lms";
import { getWeeklyAssessments, getSubmissions, recordRealStudent } from "@/lib/assessments";
import { COURSES } from "@/lib/courses";
import type { Enrollment, Course, Profile } from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const currentTab = resolvedParams.tab === "courses" ? "courses" : "assessments";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const [
    { data: profile },
    { data: enrollments },
    { data: courses },
    weeklyAssessments,
    studentSubmissions,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("enrollments").select("*, course:courses(*)").eq("user_id", user.id).order("enrolled_at", { ascending: false }),
    supabase.from("courses").select("*").order("created_at", { ascending: true }),
    getWeeklyAssessments(true),
    getSubmissions(user.id),
  ]);

  const typedProfile = profile as Profile | null;
  const typedEnrollments = (enrollments ?? []) as unknown as Enrollment[];
  const dbCourses = (courses ?? []) as Course[];
  const typedCourses = dbCourses.length >= 5 ? dbCourses : COURSES;

  // Build enrolled courses list and IDs
  const enrolledCourses = typedEnrollments.map((e) => {
    const courseObj = e.course || COURSES.find((c) => c.id === e.course_id || c.slug === e.course_id);
    return {
      id: courseObj?.id || e.course_id,
      slug: courseObj?.slug || e.course_id,
      title: courseObj?.title || "Enrolled Course",
      category: courseObj?.category || "Technology",
    };
  });
  const enrolledCourseIds = new Set(
    enrolledCourses.flatMap((c) => [c.id, c.slug])
  );

  // Isolate weekly assessments strictly to enrolled courses
  const studentAssessments = enrolledCourses.length === 0
    ? []
    : weeklyAssessments.filter((a) =>
        enrolledCourseIds.has(a.course_id) ||
        enrolledCourseIds.has(a.slug) ||
        enrolledCourses.some(
          (c) =>
            c.title.toLowerCase().includes(a.course_title.toLowerCase()) ||
            a.course_title.toLowerCase().includes(c.title.toLowerCase())
        )
      );

  const average = averageProgress(typedEnrollments);
  const completed = completedCourses(typedEnrollments);
  const active = inProgressCourses(typedEnrollments);
  const suggested = recommendedCourses(typedCourses, typedEnrollments, 6);
  const displayName = typedProfile?.full_name || (user.user_metadata?.full_name as string | undefined) || user.email || "Student";
  const avatarUrl = typedProfile?.avatar_url || (user.user_metadata?.avatar_url as string | undefined) || null;
  const firstName = displayName.split(/\s+/)[0];

  recordRealStudent({
    id: user.id,
    full_name: displayName,
    email: user.email || "",
    phone_number: typedProfile?.phone_number || (user.user_metadata?.phone_number as string | undefined) || null,
    avatar_url: avatarUrl,
  });

  return (
    <main className="dashboard">
      <div className="container">
        <div className="dashboard-grid">
          <section className="dashboard-main-col">
            {/* ── WELCOME HERO CARD ── */}
            <div className="welcome card welcome-geometric-card">
              <div className="geometric-bg-welcome" aria-hidden="true">
                <svg className="geometric-svg" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="geomGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.22" />
                      <stop offset="50%" stopColor="var(--blue)" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </linearGradient>
                    <pattern id="dotGrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.2" fill="currentColor" opacity="0.1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dotGrid)" />
                  <path d="M500 0 L680 180 L800 60 L800 0 Z" fill="url(#geomGrad1)" />
                  <polygon points="620,20 740,20 680,110" stroke="var(--blue)" strokeWidth="1.2" strokeOpacity="0.25" fill="none" />
                  <circle cx="680" cy="110" r="4" fill="var(--blue)" opacity="0.4" />
                  <polygon points="460,90 560,90 510,180" stroke="var(--orange)" strokeWidth="1.2" strokeOpacity="0.2" fill="none" />
                  <circle cx="510" cy="180" r="3.5" fill="var(--orange)" opacity="0.4" />
                  <line x1="510" y1="180" x2="680" y2="110" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />
                </svg>
              </div>

              <div className="welcome-top">
                <div className="welcome-text-group">
                  <span className="eyebrow">Student Dashboard</span>
                  <h1>Good to see you, {firstName}.</h1>
                  <p>Master industry skills with weekly hands-on deliverables, code reviews &amp; verifiable credentials.</p>
                </div>
                <Link href="/courses" className="welcome-browse-btn" title="Browse course catalog">
                  <span>Explore tracks</span>
                  <Icon name="arrow" size={14} />
                </Link>
              </div>

              <div className="kpi-grid">
                <div className="kpi">
                  <span className="num">{enrolledCourses.length > 0 ? studentAssessments.length : 0}</span>
                  <span className="label">Weekly Assignments</span>
                  <span className="hint">{studentSubmissions.length} submitted</span>
                </div>
                <div className="kpi">
                  <span className="num">{typedEnrollments.length}</span>
                  <span className="label">Enrolled Programs</span>
                  <span className="hint">Active course library</span>
                </div>
                <div className="kpi">
                  <span className="num">{completed}</span>
                  <span className="label">Certificates Earned</span>
                  <span className="hint">Programs completed</span>
                </div>
              </div>
            </div>

            {/* ── INTERACTIVE TAB SWITCHER (WEEKLY ASSESSMENTS vs ENROLLED PROGRAMS) ── */}
            <div className="dashboard-tab-bar" role="tablist" aria-label="Dashboard views">
              <Link
                href="/dashboard?tab=assessments"
                role="tab"
                aria-selected={currentTab === "assessments"}
                className={`dashboard-tab-btn ${currentTab === "assessments" ? "active" : ""}`}
              >
                <Icon name="target" size={16} />
                <span className="tab-title-full">Weekly Assessments</span>
                <span className="tab-title-short">Assessments</span>
                <span className="tab-count-badge">{enrolledCourses.length > 0 ? studentAssessments.length : 0}</span>
              </Link>
              <Link
                href="/dashboard?tab=courses"
                role="tab"
                aria-selected={currentTab === "courses"}
                className={`dashboard-tab-btn ${currentTab === "courses" ? "active" : ""}`}
              >
                <Icon name="book" size={16} />
                <span className="tab-title-full">Enrolled Programs</span>
                <span className="tab-title-short">Programs</span>
                <span className="tab-count-badge">{typedEnrollments.length}</span>
              </Link>
            </div>

            {/* ── TAB CONTENT 1: WEEKLY ASSESSMENTS (PRIMARY VIEW) ── */}
            {currentTab === "assessments" && (
              <WeeklyAssessmentsTab
                assessments={studentAssessments}
                submissions={studentSubmissions}
                studentId={user.id}
                studentName={displayName}
                studentEmail={user.email || ""}
                enrolledCourses={enrolledCourses}
              />
            )}

            {/* ── TAB CONTENT 2: ENROLLED PROGRAMS ── */}
            {currentTab === "courses" && (
              <section className="card dashboard-section" aria-labelledby="my-learning-heading">
                <div className="section-bar">
                  <div>
                    <h2 id="my-learning-heading">My enrolled programs</h2>
                    <p>Resume an enrolled course from one place.</p>
                  </div>
                  {active > 0 && <span className="status-pill">{active} active</span>}
                </div>
                {typedEnrollments.length === 0 ? (
                  <div className="empty">
                    <strong>Your learning library is empty.</strong>
                    Browse our career tracks to enroll.
                    <div style={{ marginTop: 12 }}>
                      <Link href="/courses" className="btn btn-orange btn-sm">Explore programs <Icon name="arrow" size={13} /></Link>
                    </div>
                  </div>
                ) : (
                  typedEnrollments.map((enrollment) => {
                    const progress = clampProgress(enrollment.progress_percent);
                    return (
                      <div className="enrollment-row" key={enrollment.id}>
                        <div className="enrollment-top">
                          <div className="enrollment-title">
                            <h3>{enrollment.course.title}</h3>
                            <div className="small">
                              {progress === 100 ? "Completed" : `Enrolled ${displayDate(enrollment.enrolled_at)}`}
                              &nbsp;&middot;&nbsp;{enrollment.course.level}
                            </div>
                          </div>
                          <Link href={`/courses/${enrollment.course.slug}`} className="btn btn-secondary">Open</Link>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="progress-meta">
                            <span>{progress}% complete</span>
                            <span>{enrollment.course.lessons_count} lessons &middot; {enrollment.course.duration_hours}h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            )}
          </section>

          {/* ── SIDEBAR ── */}
          <aside className="side-stack dashboard-side-col">
            <div className="card side-card dashboard-profile-card">
              <div className="profile-hero dashboard-profile-hero">
                <UserAvatar
                  userId={user.id}
                  displayName={displayName}
                  initialAvatarUrl={avatarUrl}
                  className="avatar dashboard-avatar"
                  imgClassName="avatar-img"
                />
                <div className="dashboard-profile-details">
                  <span className="status-badge-verified">
                    <Icon name="check" size={11} /> Verified Student
                  </span>
                  <h3>{displayName}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
              <div className="side-actions">
                <Link className="btn btn-secondary btn-sm full-width" href="/profile">
                  <Icon name="camera" size={13} /> Manage profile &amp; photo
                </Link>
              </div>
            </div>

            {/* Royal & Aesthetic Certificate Card */}
            <RoyalCertificateCard
              displayName={displayName}
              userId={user.id}
              courseTitle={typedEnrollments[0]?.course?.title ?? "Full-Stack Software Architecture & Systems"}
              completedCount={completed}
            />

            <div className="card side-card">
              <div className="eyebrow">Cohort Status</div>
              <div className="side-metric"><span>Weekly assignments</span><strong>{weeklyAssessments.length}</strong></div>
              <div className="side-metric"><span>Submitted labs</span><strong>{studentSubmissions.length}</strong></div>
              <div className="side-metric"><span>Average progress</span><strong>{average}%</strong></div>
            </div>
          </aside>
        </div>

        {/* ── RECOMMENDED FOR YOUR CAREER PATH (FULL WIDTH HORIZONTAL TRACK) ── */}
        {suggested.length > 0 && (
          <section className="dashboard-recommended-section" aria-labelledby="recommended-heading">
            <HorizontalCourseTrack
              courses={suggested}
              title="Recommended for your career path"
              subtitle="Courses designed to accelerate your technical depth."
              viewAllHref="/courses"
              viewAllLabel="See all"
            />
          </section>
        )}
      </div>
    </main>
  );
}
