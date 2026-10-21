import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HorizontalCourseTrack } from "@/components/horizontal-course-track";
import { Icon } from "@/components/icon";
import { COURSES } from "@/lib/courses";
import type { Course } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: true });
  const dbCourses = (data ?? []) as Course[];
  const courses = dbCourses.length >= 5 ? dbCourses : COURSES;
  const featured = courses[0];

  return (
    <main>
      {/* ── HERO SECTION ── */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="fade-in-up">
            <div className="hero-eyebrow">
              <span className="hero-dot-pulse">
                <Icon name="spark" size={11} />
              </span>
              India&apos;s #1 Career Accelerator
            </div>
            <h1>
              Build High-Impact Tech Skills &amp; Launch Your Career <span className="accent">Forward.</span>
            </h1>
            <p className="hero-subtitle">
              Sams Edutech brings industry-aligned curriculums, hands-on projects, and verifiable credentials into one focused student workspace &mdash; structured to help you master real-world engineering.
            </p>
            <div className="hero-actions">
              <Link href="/auth/register" className="btn btn-orange">
                Explore Programs <Icon name="arrow" size={16} />
              </Link>
              <Link href="/courses" className="btn btn-secondary">
                View Full Catalog
              </Link>
            </div>
            <div className="hero-social-proof">
              <div className="avatar-stack">
                <span className="stack-avatar bg-blue">S</span>
                <span className="stack-avatar bg-orange">A</span>
                <span className="stack-avatar bg-dark">M</span>
                <span className="stack-avatar bg-green">S</span>
              </div>
              <div className="proof-text">
                <strong>10,000+ Students Enrolled</strong>
                <span>4.9 / 5 Rating across active cohorts</span>
              </div>
            </div>
          </div>

          <div className="hero-panel fade-in-up" aria-label="Learning dashboard preview">
            <div className="hero-panel-head">
              <div>
                <div className="panel-overline">Sams Learning Track</div>
                <div className="panel-title">Progress You Can Track &amp; Verify</div>
              </div>
              <span className="panel-tag">Live Cohort</span>
            </div>
            <div className="hero-progress">
              <div className="hero-progress-top">
                <div>
                  <strong>78%</strong>
                  <span>milestones achieved</span>
                </div>
                <span className="status-pill">On Schedule</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: "78%" }} />
              </div>
            </div>
            <div className="metric-row">
              <div className="metric">
                <strong>₹6–14 LPA</strong>
                <span>Avg. Placement CTC</span>
              </div>
              <div className="metric">
                <strong>1-on-1</strong>
                <span>Mentor Code Reviews</span>
              </div>
              <div className="metric">
                <strong>100%</strong>
                <span>Self-Paced or Live</span>
              </div>
              <div className="metric">
                <strong>Verified</strong>
                <span>ISO &amp; Govt Aligned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECOGNITION MARQUEE / BADGE STRIP ── */}
      <section className="recog-strip">
        <div className="container">
          <div className="recog-inner">
            <span className="recog-label">Curriculum Standards &amp; Industry Alignment:</span>
            <div className="recog-pills">
              <span className="info-chip">AICTE Aligned</span>
              <span className="info-chip">Skill India Framework</span>
              <span className="info-chip">Startup India Certified</span>
              <span className="info-chip">NASSCOM Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="section bg-surface">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-icon icon-orange">
                <Icon name="user" size={20} />
              </div>
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Active Learners</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon icon-blue">
                <Icon name="book" size={20} />
              </div>
              <div className="stat-number">50+</div>
              <div className="stat-label">Industry Modules</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon icon-cyan">
                <Icon name="target" size={20} />
              </div>
              <div className="stat-number">200+</div>
              <div className="stat-label">Hiring Partners</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon icon-purple">
                <Icon name="shield" size={20} />
              </div>
              <div className="stat-number">100%</div>
              <div className="stat-label">Private &amp; Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROGRAMS HORIZONTAL CAROUSEL SECTION ── */}
      <section className="section" id="courses">
        <div className="container">
          <HorizontalCourseTrack
            courses={courses}
            featuredId={featured?.id}
            eyebrow="Industry Ready Programs"
            title="Specialized Career Tracks"
            subtitle="Curated by senior software architects and security researchers. Hands-on learning with verifiable certificates."
            viewAllHref="/courses"
            viewAllLabel="View All Programs"
          />
        </div>
      </section>

      {/* ── WHY SAMS EDUTECH / VALUE PILLARS ── */}
      <section className="section soft">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="sec-eyebrow">Engineered For Excellence</span>
              <h2 className="section-title">Why Professionals Choose Sams Edutech</h2>
            </div>
          </div>
          <div className="card-grid">
            {[
              {
                icon: "grid",
                title: "Purpose-Built Student Hub",
                copy: "Resume your learning instantly without clutter. All assignments, progress metrics, and recordings stay organized.",
              },
              {
                icon: "target",
                title: "Job-Ready Curriculum",
                copy: "Every track is built around real production codebases, threat models, and software engineering best practices.",
              },
              {
                icon: "shield",
                title: "Bank-Grade Data Security",
                copy: "Row Level Security (RLS) and cryptographic tokens protect your student records, credentials, and progress.",
              },
            ].map((feature) => (
              <div className="why-feat" key={feature.title}>
                <div className="story-point-icon">
                  <Icon name={feature.icon} size={20} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
