"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { displayDate, formatTimeRemaining } from "@/lib/utils";
import type { WeeklyAssessment, AssessmentSubmission } from "@/lib/types";

interface WeeklyAssessmentsTabProps {
  assessments: WeeklyAssessment[];
  submissions: AssessmentSubmission[];
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export function WeeklyAssessmentsTab({
  assessments,
  submissions,
  studentId,
  studentName,
  studentEmail,
}: WeeklyAssessmentsTabProps) {
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [submittingAssessment, setSubmittingAssessment] = useState<WeeklyAssessment | null>(null);

  // Form states
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Map submissions by assessment_id
  const submissionMap = new Map<string, AssessmentSubmission>();
  for (const s of submissions) {
    submissionMap.set(s.assessment_id, s);
  }

  // Filter assessments
  const filtered = selectedWeek === "all"
    ? assessments
    : assessments.filter((a) => a.week_number === selectedWeek);

  // Compute metrics
  const total = assessments.length;
  const submittedCount = submissions.length;
  const gradedList = submissions.filter((s) => s.status === "graded" && typeof s.score === "number");
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
  const availableWeeks = Array.from(new Set(assessments.map((a) => a.week_number))).sort((a, b) => a - b);

  return (
    <div className="weekly-assessments-hub">
      {/* ── TOP KPI BANNER (Replaces old static progress bar) ── */}
      <div className="assessments-kpi-banner card">
        <div className="kpi-banner-header">
          <div>
            <div className="sec-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span className="live-dot" /> Cohort Weekly Assignments
            </div>
            <h2 style={{ margin: "4px 0 6px", fontSize: "1.35rem", fontWeight: 800 }}>
              Practical Engineering Assessments
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
              Work on hands-on weekly deliverables, submit your code for code review, and receive certified mentor evaluation.
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
            <span>{gradedCount} certified reviews completed</span>
          </div>
        </div>
      </div>

      {/* ── FILTER CHIPS BY WEEK ── */}
      <div className="week-filter-bar" style={{ margin: "20px 0 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`filter-chip ${selectedWeek === "all" ? "active" : ""}`}
          onClick={() => setSelectedWeek("all")}
        >
          All Weeks ({assessments.length})
        </button>
        {availableWeeks.map((week) => {
          const count = assessments.filter((a) => a.week_number === week).length;
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
          <h3 style={{ marginTop: 12 }}>No weekly assessments published for this selection.</h3>
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
                <div className="assessment-card-top">
                  <div className="assessment-badges-row">
                    <span className="badge-week">Week {assessment.week_number}</span>
                    <span className="badge-difficulty">{assessment.difficulty}</span>
                    <span className="badge-points">{assessment.max_points} Points</span>
                    <span className="badge-course-track">{assessment.course_title}</span>
                  </div>

                  <div className="assessment-deadline-pill">
                    <Icon name="clock" size={13} />
                    <span className={deadline.overdue && !isSubmitted ? "text-danger" : ""}>
                      {deadline.overdue && !isSubmitted ? `Deadline Passed (${deadline.label})` : deadline.label}
                    </span>
                  </div>
                </div>

                <div className="assessment-body" style={{ marginTop: 14 }}>
                  <h3 className="assessment-title" style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 8px" }}>
                    {assessment.title}
                  </h3>
                  <p className="assessment-desc" style={{ color: "var(--ink-secondary)", fontSize: "0.9rem", lineHeight: 1.55 }}>
                    {assessment.description}
                  </p>

                  {/* Objectives list */}
                  {assessment.objectives && assessment.objectives.length > 0 && (
                    <div className="assessment-section-box">
                      <div className="box-title">Core Lab Objectives:</div>
                      <ul className="objectives-list">
                        {assessment.objectives.map((obj, i) => (
                          <li key={i}>
                            <Icon name="check" size={12} />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Deliverables list */}
                  {assessment.deliverables && assessment.deliverables.length > 0 && (
                    <div className="assessment-section-box" style={{ marginTop: 10 }}>
                      <div className="box-title">Required Deliverables:</div>
                      <ul className="deliverables-list">
                        {assessment.deliverables.map((deliv, i) => (
                          <li key={i}>
                            <Icon name="spark" size={12} />
                            <span>{deliv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Starter Repo if provided */}
                  {assessment.starter_repo_url && (
                    <div style={{ marginTop: 12 }}>
                      <a
                        href={assessment.starter_repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
                      >
                        <Icon name="arrow" size={13} /> Starter Lab Repository &rarr;
                      </a>
                    </div>
                  )}
                </div>

                {/* ── SUBMISSION STATUS & ACTIONS FOOTER ── */}
                <div className="assessment-card-footer" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  {isGraded && submission ? (
                    <div className="graded-banner">
                      <div className="graded-score-group">
                        <div className="score-badge">
                          <span className="score-num">{submission.score}</span>
                          <span className="score-max">/{assessment.max_points}</span>
                        </div>
                        <div>
                          <div className="grade-badge-pill">Grade {submission.grade || "A"} &bull; Verified</div>
                          <div className="graded-date">Reviewed {displayDate(submission.graded_at)} by {submission.graded_by || "Head Mentor"}</div>
                        </div>
                      </div>

                      {submission.feedback && (
                        <div className="mentor-feedback-quote" style={{ marginTop: 12 }}>
                          <div className="feedback-label">
                            <Icon name="spark" size={13} /> Mentor Evaluation:
                          </div>
                          <p>{submission.feedback}</p>
                        </div>
                      )}

                      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                        <a
                          href={submission.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          View Submitted Code
                        </a>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openSubmitModal(assessment)}
                        >
                          Update Submission
                        </button>
                      </div>
                    </div>
                  ) : submission ? (
                    <div className="submitted-banner">
                      <div className="submitted-status-row">
                        <span className="status-badge-submitted">
                          <Icon name="check" size={12} /> Submitted &bull; Awaiting Mentor Review
                        </span>
                        <span className="submitted-timestamp">
                          Submitted on {displayDate(submission.submitted_at)}
                        </span>
                      </div>

                      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
                        <a
                          href={submission.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          View Solution
                        </a>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openSubmitModal(assessment)}
                        >
                          Resubmit Solution
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pending-banner">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                        <div className="pending-notice">
                          <Icon name="clock" size={14} /> Due: {displayDate(assessment.due_date)}
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
