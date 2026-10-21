"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { displayDate, formatTimeRemaining } from "@/lib/utils";
import type { WeeklyAssessment, AssessmentSubmission } from "@/lib/types";

interface EnrolledCourseSummary {
  id: string;
  slug: string;
  title: string;
  category?: string;
}

interface WeeklyAssessmentsTabProps {
  assessments: WeeklyAssessment[];
  submissions: AssessmentSubmission[];
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrolledCourses?: EnrolledCourseSummary[];
}

export function WeeklyAssessmentsTab({
  assessments,
  submissions,
  studentId,
  studentName,
  studentEmail,
  enrolledCourses = [],
}: WeeklyAssessmentsTabProps) {
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [submittingAssessment, setSubmittingAssessment] = useState<WeeklyAssessment | null>(null);

  // Form states
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Zero enrollment condition: Student has not enrolled in any program yet
  const hasEnrollments = enrolledCourses.length > 0;

  // Map submissions by assessment_id
  const submissionMap = new Map<string, AssessmentSubmission>();
  for (const s of submissions) {
    submissionMap.set(s.assessment_id, s);
  }

  // Filter assessments by course first, then by week
  const courseFiltered = selectedCourse === "all"
    ? assessments
    : assessments.filter(
        (a) =>
          a.course_id === selectedCourse ||
          a.slug.includes(selectedCourse) ||
          a.course_title.toLowerCase().includes(selectedCourse.toLowerCase())
      );

  const filtered = selectedWeek === "all"
    ? courseFiltered
    : courseFiltered.filter((a) => a.week_number === selectedWeek);

  // Compute metrics
  const total = assessments.length;
  const submittedCount = submissions.filter((s) => assessments.some((a) => a.id === s.assessment_id)).length;
  const gradedList = submissions.filter(
    (s) => s.status === "graded" && typeof s.score === "number" && assessments.some((a) => a.id === s.assessment_id)
  );
  const gradedCount = gradedList.length;
  const totalScoreEarned = gradedList.reduce((sum, s) => sum + (s.score || 0), 0);
  const totalPossible = gradedList.reduce((sum, s) => {
    const parent = assessments.find((a) => a.id === s.assessment_id);
    return sum + (parent?.max_points || 100);
  }, 0);
  const scorePercent = totalPossible > 0 ? Math.round((totalScoreEarned / totalPossible) * 100) : 0;

  function openSubmitModal(assessment: WeeklyAssessment) {
    const existing = submissionMap.get(assessment.id);
    setSubmittingAssessment(assessment);
    setGithubUrl(existing?.github_url || "");
    setDemoUrl(existing?.demo_url || "");
    setNotes(existing?.notes || "");
    setFormError("");
    setFormSuccess("");
  }

  async function handleSubmission(e: React.FormEvent) {
    e.preventDefault();
    if (!submittingAssessment) return;
    setFormError("");
    setFormSuccess("");

    if (!githubUrl.trim().startsWith("http")) {
      return setFormError("Please enter a valid HTTP/HTTPS URL for your GitHub repository or solution.");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: submittingAssessment.id,
          user_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          github_url: githubUrl.trim(),
          demo_url: demoUrl.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit assignment.");
      }

      setFormSuccess("Assignment submitted successfully! Our mentors will review your code.");
      setTimeout(() => {
        setSubmittingAssessment(null);
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Weeks list for pill filter
  const availableWeeks = Array.from(new Set(courseFiltered.map((a) => a.week_number))).sort((a, b) => a - b);

  // If user is not enrolled in any course: Show course enrollment guidance
  if (!hasEnrollments) {
    return (
      <div className="weekly-assessments-hub">
        <div className="card empty-state zero-enrollment-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div
            className="empty-icon"
            style={{
              margin: "0 auto 16px",
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "var(--blue-soft)",
              display: "grid",
              placeItems: "center",
              color: "var(--blue)",
            }}
          >
            <Icon name="lock" size={26} />
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 10px", color: "var(--ink)" }}>
            Weekly Assignments &amp; Marks are Course-Specific
          </h2>
          <p
            style={{
              maxWidth: 580,
              margin: "0 auto 24px",
              color: "var(--muted)",
              fontSize: "0.92rem",
              lineHeight: 1.65,
            }}
          >
            Weekly practical engineering deliverables, hands-on labs, and instructor evaluations are tailored specifically to your enrolled track. Enroll in one of our 5 specialized career tracks to unlock your cohort curriculum and start earning verified marks.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/courses" className="btn btn-orange">
              Explore 5 Specialized Programs &amp; Enroll <Icon name="arrow" size={15} />
            </Link>
          </div>

          <div
            className="locked-features-preview"
            style={{
              marginTop: 36,
              paddingTop: 24,
              borderTop: "1px solid var(--line)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              textAlign: "left",
            }}
          >
            <div className="feat-mini-box">
              <strong style={{ display: "block", fontSize: "0.86rem", color: "var(--ink)" }}>🎯 Course-Specific Labs</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Tailored weekly challenges matching your exact specialization</span>
            </div>
            <div className="feat-mini-box">
              <strong style={{ display: "block", fontSize: "0.86rem", color: "var(--ink)" }}>💻 GitHub Submissions</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Push real code repos &amp; receive code review feedback</span>
            </div>
            <div className="feat-mini-box">
              <strong style={{ display: "block", fontSize: "0.86rem", color: "var(--ink)" }}>🏆 Certified Marks &amp; GPA</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Scores out of 100 with official instructor grading</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="weekly-assessments-hub">
      {/* ── TOP KPI BANNER ── */}
      <div className="assessments-kpi-banner card">
        <div className="kpi-banner-header">
          <div>
            <div className="sec-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span className="live-dot" /> Enrolled Cohort Weekly Assignments
            </div>
            <h2 style={{ margin: "4px 0 6px", fontSize: "1.35rem", fontWeight: 800 }}>
              Practical Engineering Assessments
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
              Tailored to your enrolled programs. Work on hands-on deliverables, submit your code for review, and receive instructor marks.
            </p>
          </div>
          <div className="assessment-stat-pills">
            <div className="stat-pill">
              <span className="stat-val">{submittedCount}/{total}</span>
              <span className="stat-lbl">Submitted</span>
            </div>
            <div className="stat-pill highlight">
              <span className="stat-val">{gradedCount > 0 ? `${scorePercent}%` : "Pending"}</span>
              <span className="stat-lbl">Average Score</span>
            </div>
          </div>
        </div>

        {/* Dynamic Assignment Progress Bar */}
        <div className="assessment-progress-wrapper" style={{ marginTop: 18 }}>
          <div className="progress-track" style={{ height: "8px" }}>
            <div
              className="progress-fill"
              style={{
                width: `${total > 0 ? (submittedCount / total) * 100 : 0}%`,
                background: "linear-gradient(90deg, var(--blue) 0%, var(--orange) 100%)",
              }}
            />
          </div>
          <div className="progress-meta" style={{ marginTop: 6, fontSize: "0.78rem" }}>
            <span>{submittedCount} of {total} weekly assignments submitted ({total > 0 ? Math.round((submittedCount / total) * 100) : 0}%)</span>
            <span>{gradedCount} certified instructor reviews completed</span>
          </div>
        </div>
      </div>

      {/* ── COURSE TRACK FILTER BAR (If student is enrolled in multiple programs) ── */}
      {enrolledCourses.length > 1 && (
        <div className="course-filter-bar" style={{ margin: "18px 0 6px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)" }}>Filter by Program:</span>
          <button
            type="button"
            className={`filter-chip ${selectedCourse === "all" ? "active" : ""}`}
            onClick={() => setSelectedCourse("all")}
          >
            All My Enrolled Programs ({assessments.length})
          </button>
          {enrolledCourses.map((c) => {
            const count = assessments.filter(
              (a) =>
                a.course_id === c.id ||
                a.course_id === c.slug ||
                a.course_title.toLowerCase().includes(c.title.toLowerCase())
            ).length;
            return (
              <button
                key={c.id}
                type="button"
                className={`filter-chip ${selectedCourse === c.slug || selectedCourse === c.id ? "active" : ""}`}
                onClick={() => setSelectedCourse(c.slug)}
              >
                {c.title.split("(")[0].trim()} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ── FILTER CHIPS BY WEEK ── */}
      <div className="week-filter-bar" style={{ margin: "14px 0 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`filter-chip ${selectedWeek === "all" ? "active" : ""}`}
          onClick={() => setSelectedWeek("all")}
        >
          All Weeks ({courseFiltered.length})
        </button>
        {availableWeeks.map((week) => {
          const count = courseFiltered.filter((a) => a.week_number === week).length;
          return (
            <button
              key={week}
              type="button"
              className={`filter-chip ${selectedWeek === week ? "active" : ""}`}
              onClick={() => setSelectedWeek(week)}
            >
              Week {week} ({count})
            </button>
          );
        })}
      </div>

      {/* ── ASSESSMENTS CARDS LIST ── */}
      {filtered.length === 0 ? (
        <div className="card empty-state" style={{ padding: 36, textAlign: "center" }}>
          <Icon name="target" size={32} />
          <h3 style={{ marginTop: 12 }}>No weekly assessments found for this selection.</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>Check back shortly or browse other weeks.</p>
        </div>
      ) : (
        <div className="assessments-stack" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {filtered.map((assessment) => {
            const submission = submissionMap.get(assessment.id);
            const isSubmitted = Boolean(submission);
            const isGraded = submission?.status === "graded";
            const deadline = formatTimeRemaining(assessment.due_date);

            return (
              <article key={assessment.id} className="card assessment-card">
                {/* Header Row */}
                <div className="assessment-card-top">
                  <div className="assessment-badges-row">
                    <span className="badge-week">Week {assessment.week_number}</span>
                    <span className="badge-course-track">{assessment.course_title}</span>
                    <span className="badge-difficulty">{assessment.difficulty}</span>
                    <span className="badge-points">{assessment.max_points} Points</span>
                  </div>
                  <div className="assessment-deadline-pill">
                    <Icon name="clock" size={14} />
                    <span className={deadline.overdue && !isSubmitted ? "text-danger" : ""}>
                      Due: {displayDate(assessment.due_date)} &middot; {deadline.label}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div style={{ marginTop: 14 }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 8px", color: "var(--ink)" }}>
                    {assessment.title}
                  </h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {assessment.description}
                  </p>
                </div>

                {/* Objectives */}
                {assessment.objectives && assessment.objectives.length > 0 && (
                  <div className="assessment-section-box">
                    <strong style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 6 }}>
                      Key Engineering Objectives
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                      {assessment.objectives.map((obj, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Deliverables */}
                {assessment.deliverables && assessment.deliverables.length > 0 && (
                  <div className="assessment-section-box" style={{ marginTop: 10 }}>
                    <strong style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 6 }}>
                      Required Deliverables
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                      {assessment.deliverables.map((del, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{del}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Starter Repo Link */}
                {assessment.starter_repo_url && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="git-branch" size={15} />
                    <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>Starter Laboratory Code:</span>
                    <a
                      href={assessment.starter_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="assessment-repo-link"
                      style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--blue)" }}
                    >
                      {assessment.starter_repo_url.replace("https://github.com/", "")} &rarr;
                    </a>
                  </div>
                )}

                {/* Submission & Grading Status Footer */}
                <div className="assessment-footer-bar" style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  {submission && isGraded ? (
                    <div className="graded-summary-box">
                      <div className="graded-header">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span className="grade-badge grade-badge-success">
                            <Icon name="check" size={14} /> Evaluation Completed
                          </span>
                          <span className="grade-score-pill">
                            Score: <strong>{submission.score}</strong> / {assessment.max_points}
                          </span>
                          {submission.grade && (
                            <span className="grade-letter-pill">Grade: {submission.grade}</span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                          Graded on {displayDate(submission.graded_at || submission.submitted_at)}
                        </span>
                      </div>
                      {submission.feedback && (
                        <div className="grade-feedback-text">
                          <strong>Instructor Review &amp; Code Feedback:</strong>
                          <p style={{ margin: "4px 0 0" }}>{submission.feedback}</p>
                        </div>
                      )}
                      <div style={{ marginTop: 10, display: "flex", gap: 14, fontSize: "0.8rem" }}>
                        <a href={submission.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontWeight: 700 }}>
                          View Submitted Repository &rarr;
                        </a>
                        {submission.demo_url && (
                          <a href={submission.demo_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontWeight: 700 }}>
                            View Demo Link &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  ) : submission && isSubmitted ? (
                    <div className="submitted-status-box">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="status-pill status-pill-pending">
                            <span className="status-dot status-dot-pending" /> Under Review
                          </span>
                          <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
                            Submitted on {displayDate(submission.submitted_at)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openSubmitModal(assessment)}
                        >
                          Update Submission
                        </button>
                      </div>
                      <div style={{ marginTop: 8, fontSize: "0.8rem", color: "var(--muted)" }}>
                        Repo: <a href={submission.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>{submission.github_url}</a>
                      </div>
                    </div>
                  ) : (
                    <div className="unsubmitted-status-box">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="status-pill status-pill-unsubmitted">Not Submitted</span>
                          <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
                            Pass threshold: {assessment.passing_points} pts
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-orange btn-sm"
                          onClick={() => openSubmitModal(assessment)}
                        >
                          Submit Weekly Assignment <Icon name="arrow" size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── SUBMISSION MODAL ── */}
      {submittingAssessment && (
        <div className="modal-backdrop" onClick={() => !submitting && setSubmittingAssessment(null)}>
          <div className="modal-card submission-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="sec-eyebrow">Weekly Assignment Submission</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "1.2rem", fontWeight: 800 }}>
                  {submittingAssessment.title}
                </h3>
                <span style={{ fontSize: "0.82rem", color: "var(--blue)", fontWeight: 700 }}>
                  {submittingAssessment.course_title}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !submitting && setSubmittingAssessment(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmission} style={{ marginTop: 16 }}>
              {formError && <div className="form-error" role="alert" style={{ marginBottom: 14 }}>{formError}</div>}
              {formSuccess && <div className="form-success" role="status" style={{ marginBottom: 14 }}>{formSuccess}</div>}

              <div className="field">
                <label htmlFor="github-url">GitHub Repository or Solution URL *</label>
                <input
                  id="github-url"
                  type="url"
                  placeholder="https://github.com/your-username/week-assignment"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  required
                />
                <span className="field-hint">Public repository or accessible Git repository URL</span>
              </div>

              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="demo-url">Live Deployment / Demo Link (Optional)</label>
                <input
                  id="demo-url"
                  type="url"
                  placeholder="https://your-deployment.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                />
              </div>

              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="notes">Implementation Notes &amp; Reflection</label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Summarize your approach, key decisions, tests conducted, or questions for the mentor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                />
                <span className="field-hint" style={{ textAlign: "right", display: "block" }}>
                  {notes.length}/1000 characters
                </span>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button
                  type="submit"
                  className="btn btn-orange"
                  disabled={submitting}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {submitting ? "Uploading Submission..." : "Confirm & Submit Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}