import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayDate } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { CourseCard } from "@/components/course-card";
import { RoyalCertificateCard } from "@/components/royal-certificate-card";
import { UserAvatar } from "@/components/user-avatar";
import { WeeklyAssessmentsTab } from "@/components/weekly-assessments-tab";
import { averageProgress, clampProgress, completedCourses, inProgressCourses, recommendedCourses } from "@/lib/lms";
import { getWeeklyAssessments, getSubmissions } from "@/lib/assessments";
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
  const average = averageProgress(typedEnrollments);
  const completed = completedCourses(typedEnrollments);
  const active = inProgressCourses(typedEnrollments);
  const suggested = recommendedCourses(typedCourses, typedEnrollments);
  const displayName = typedProfile?.full_name || (user.user_metadata?.full_name as string | undefined) || user.email || "Student";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) || typedProfile?.avatar_url || null;
  const firstName = displayName.split(/\s+/)[0];

  return (
    <main className="dashboard">
      <div className="container">
        <div className="dashboard-grid">
          <section>
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
                  <span className="num">{weeklyAssessments.length}</span>
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
            <div className="dashboard-tab-bar" style={{ margin: "22px 0 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <Link
                href="/dashboard?tab=assessments"
                className={`btn ${currentTab === "assessments" ? "btn-orange" : "btn-secondary"} btn-sm`}
                style={{ borderRadius: "8px" }}
              >
                <Icon name="target" size={15} /> Weekly Assessments &amp; Assignments ({weeklyAssessments.length})
              </Link>
              <Link
                href="/dashboard?tab=courses"
                className={`btn ${currentTab === "courses" ? "btn-orange" : "btn-secondary"} btn-sm`}
                style={{ borderRadius: "8px" }}
              >
                <Icon name="book" size={15} /> My Enrolled Programs ({typedEnrollments.length})
              </Link>
            </div>

            {/* ── TAB CONTENT 1: WEEKLY ASSESSMENTS (PRIMARY VIEW) ── */}
            {currentTab === "assessments" && (
              <WeeklyAssessmentsTab
                assessments={weeklyAssessments}
                submissions={studentSubmissions}
                studentId={user.id}
                studentName={displayName}
                studentEmail={user.email || ""}
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

            {suggested.length > 0 && (
              <section className="section" style={{ padding: "30px 0 0" }} aria-labelledby="recommended-heading">
                <div className="section-bar">
                  <div>
                    <h2 id="recommended-heading">Recommended for your career path</h2>
                    <p>Courses designed to accelerate your technical depth.</p>
                  </div>
                  <Link href="/courses" className="btn btn-ghost">See all <Icon name="arrow" size={15} /></Link>
                </div>
                <div className="card-grid">
                  {suggested.map((course) => <CourseCard key={course.id} course={course} />)}
                </div>
              </section>
            )}
          </section>

          {/* ── SIDEBAR ── */}
          <aside className="side-stack">
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

            <div className="card side-card" style={{ background: "var(--blue-soft)" }}>
              <div className="story-point-icon"><Icon name="spark" /></div>
              <h3 style={{ marginTop: 12 }}>Admin &amp; Mentor Support</h3>
              <p>Weekly assessments are graded by senior engineering mentors with verified feedback.</p>
              <Link className="btn btn-secondary" href="/admin">Visit Admin Console</Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
