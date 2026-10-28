import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EnrollButton } from "@/components/enroll-button";
import { Icon } from "@/components/icon";
import { getCourseSyllabus } from "@/lib/lms";
import { COURSES, getCourseBySlug } from "@/lib/courses";
import { getCoursePriceConfig } from "@/lib/courses-server";
import type { Course } from "@/lib/types";

export function generateStaticParams() {
  return COURSES.map((course) => ({ slug: course.slug }));
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const [{ data: course }, { data: { user } }] = await Promise.all([
    supabase.from("courses").select("*").eq("slug", slug).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const fallbackCourse = getCourseBySlug(slug);
  const typedCourse = (course ? { ...fallbackCourse, ...(course as Course) } : fallbackCourse) as Course | undefined;

  if (!typedCourse) {
    return (
      <main className="section">
        <div className="container">
          <div className="card empty-state">
            <div className="empty-icon"><Icon name="book" size={22} /></div>
            <strong>We could not find that course.</strong>
            <span>It may have been moved or updated in the catalog.</span>
            <Link href="/courses" className="btn btn-secondary">Back to programs</Link>
          </div>
        </div>
      </main>
    );
  }

  const pricingConfig = getCoursePriceConfig(typedCourse.slug);
  const pricing = {
    price: pricingConfig.price,
    original: pricingConfig.original_price,
    discount_percent: pricingConfig.discount_percent,
  };
  const syllabus = getCourseSyllabus(typedCourse.slug);

  let enrolled = false;
  if (user) {
    const { data } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", typedCourse.id)
      .maybeSingle();
    enrolled = Boolean(data);
  }

  return (
    <>
      <header className="page-head">
        <div className="container">
          <Link
            href="/courses"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--blue)", fontWeight: 700, fontSize: "0.82rem" }}
          >
            <Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} /> Back to catalog
          </Link>
          <h1 style={{ marginBottom: 0 }}>Course Curriculum &amp; Enrollment</h1>
        </div>
      </header>

      <main className="course-detail">
        <div className="container">
          <div className="course-detail-layout">
            <section className="course-main-column">
              {/* ── COURSE HERO BANNER ── */}
              <div className="card course-hero">
                <div className={`course-banner ${typedCourse.accent}`}>
                  <div>
                    <div className="banner-kicker">{typedCourse.category} &middot; {typedCourse.level} &middot; {typedCourse.duration_months ?? 3} Months Plan</div>
                    <h1>{typedCourse.title}</h1>
                  </div>
                </div>
                <div className="course-overview">
                  <h2>Program Overview</h2>
                  <p className="course-detail-copy">{typedCourse.description}</p>
                  <ul className="feature-list">
                    {typedCourse.highlights.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>

              {/* ── COMPREHENSIVE SYLLABUS SECTION ── */}
              <div className="card syllabus-card" style={{ marginTop: 24, padding: 26 }}>
                <div className="syllabus-header">
                  <div>
                    <span className="sec-eyebrow">Detailed Learning Roadmap</span>
                    <h2 style={{ margin: "4px 0 6px", fontSize: "1.35rem", fontWeight: 800 }}>Complete Course Syllabus</h2>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                      {syllabus.length} Core Modules &bull; {typedCourse.lessons_count} Interactive Lessons &bull; {typedCourse.duration_hours} Hours Estimated Learning
                    </p>
                  </div>
                  <span className="info-chip" style={{ alignSelf: "flex-start" }}>
                    <Icon name="spark" size={13} /> Updated for 2026
                  </span>
                </div>

                <div className="syllabus-modules-list" style={{ marginTop: 20 }}>
                  {syllabus.map((mod, index) => (
                    <div className="syllabus-module-box" key={mod.title}>
                      <div className="module-title-row">
                        <div className="module-index-badge">{index + 1}</div>
                        <div style={{ flex: 1 }}>
                          <h3 className="module-title">{mod.title}</h3>
                          <span className="module-duration">{mod.duration}</span>
                        </div>
                      </div>
                      <ul className="module-topics-list">
                        {mod.topics.map((topic) => (
                          <li key={topic} className="module-topic-item">
                            <span className="topic-bullet">&bull;</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── ENROLLMENT & PAYMENT SIDEBAR ── */}
            <aside className="card course-side" aria-label="Course enrollment and pricing">
              <span className="sec-eyebrow" style={{ fontSize: "10px", marginBottom: "6px" }}>Student Enrollment</span>
              <div className="price-container" style={{ marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span className="course-price">&#8377;{pricing.price.toLocaleString()}</span>
                  <span className="course-original-price">&#8377;{pricing.original.toLocaleString()}</span>
                </div>
                {pricing.discount_percent > 0 && (
                  <span className="discount-badge">{pricing.discount_percent}% Limited Scholarship Offer</span>
                )}
              </div>
              <div className="muted" style={{ marginTop: 6, fontSize: "0.78rem" }}>
                Includes Lifetime Portal Access, Mentorship &amp; Certificate
              </div>

              <div className="course-stats" style={{ margin: "20px 0" }}>
                <div className="course-stat">
                  <Icon name="book" size={17} />
                  <strong>{typedCourse.lessons_count}</strong> lessons with live code files
                </div>
                <div className="course-stat">
                  <Icon name="clock" size={17} />
                  <strong>{typedCourse.duration_hours}h</strong> structured learning effort
                </div>
                <div className="course-stat">
                  <Icon name="target" size={17} />
                  <strong>{typedCourse.level}</strong> level path
                </div>
                <div className="course-stat">
                  <Icon name="shield" size={17} />
                  <strong>Govt &amp; Industry</strong> Aligned Certificate
                </div>
              </div>

              {user ? (
                <EnrollButton
                  courseId={typedCourse.id}
                  courseTitle={typedCourse.title}
                  price={pricing.price}
                  enrolled={enrolled}
                />
              ) : (
                <Link
                  className="btn btn-orange"
                  style={{ width: "100%", justifyContent: "center" }}
                  href={`/auth/login?next=${encodeURIComponent(`/courses/${typedCourse.slug}`)}`}
                >
                  Sign in to Enroll &bull; &#8377;{pricing.price.toLocaleString()} <Icon name="arrow" size={15} />
                </Link>
              )}

              <div className="payment-trust-badge" style={{ marginTop: 16 }}>
                <Icon name="shield" size={14} /> Instant UPI / NetBanking / Cards &bull; 7-Day Refund Guarantee
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
