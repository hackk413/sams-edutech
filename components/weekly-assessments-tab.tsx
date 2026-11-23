"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { displayDate, formatTimeRemaining } from "@/lib/utils";
import type { WeeklyAssessment, AssessmentSubmission, McqQuestion } from "@/lib/types";

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

  // Active MCQ Modal states
  const [activeAssessment, setActiveAssessment] = useState<WeeklyAssessment | null>(null);
  const [modalMode, setModalMode] = useState<"take" | "review">("take");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    score: number;
    correctCount: number;
    total: number;
    grade: string;
    passed: boolean;
  } | null>(null);

  // Zero enrollment condition
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
  const submittedList = submissions.filter((s) => assessments.some((a) => a.id === s.assessment_id));
  const submittedCount = submittedList.length;
  const gradedList = submittedList.filter(
    (s) => s.status === "graded" && typeof s.score === "number"
  );
  const gradedCount = gradedList.length;
  const totalScoreEarned = gradedList.reduce((sum, s) => sum + (s.score || 0), 0);
  const scorePercent = gradedCount > 0 ? Math.round(totalScoreEarned / gradedCount) : 0;

  function openTakeModal(assessment: WeeklyAssessment) {
    const existing = submissionMap.get(assessment.id);
    setActiveAssessment(assessment);
    setModalMode("take");
    setCurrentQIndex(0);
    setErrorMsg("");
    setSubmissionSuccess(null);

    // If previously submitted, pre-populate answers for retake or start fresh
    if (existing?.answers && typeof existing.answers === "object") {
      setAnswers({ ...existing.answers });
    } else {
      setAnswers({});
    }
  }

  function openReviewModal(assessment: WeeklyAssessment) {
    const existing = submissionMap.get(assessment.id);
    setActiveAssessment(assessment);
    setModalMode("review");
    setCurrentQIndex(0);
    setErrorMsg("");
    setSubmissionSuccess(null);
    if (existing?.answers && typeof existing.answers === "object") {
      setAnswers({ ...existing.answers });
    } else {
      setAnswers({});
    }
  }

  function handleSelectOption(questionId: number, optionIndex: number) {
    if (modalMode === "review") return; // Read-only in review mode
    setAnswers((prev) => ({
      ...prev,
      [questionId.toString()]: optionIndex,
    }));
  }

  async function handleSubmitAssessment() {
    if (!activeAssessment) return;
    setErrorMsg("");

    const questions: McqQuestion[] = activeAssessment.questions || [];
    const totalQ = questions.length || 20;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < totalQ) {
      const confirmIncomplete = window.confirm(
        `You have answered ${answeredCount} of ${totalQ} questions. Unanswered questions will be marked as incorrect. Are you sure you want to submit now?`
      );
      if (!confirmIncomplete) return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: activeAssessment.id,
          user_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          answers,
          notes: `Completed 20-Question MCQ Assessment with ${answeredCount} answered questions.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit assessment.");
      }

      const returnedSubmission: AssessmentSubmission = data.submission;
      const score = returnedSubmission.score ?? 0;
      const correctCount = returnedSubmission.correct_count ?? Math.round((score / 100) * totalQ);
      const passed = score >= (activeAssessment.passing_points || 70);

      setSubmissionSuccess({
        score,
        correctCount,
        total: totalQ,
        grade: returnedSubmission.grade || (passed ? "Pass" : "Needs Revision"),
        passed,
      });

      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const availableWeeks = Array.from(new Set(courseFiltered.map((a) => a.week_number))).sort((a, b) => a - b);

  // If user is not enrolled in any course: Show course enrollment guidance
  if (!hasEnrollments) {
    return (
      <div className="weekly-assessments-hub">
        <div className="card empty-state zero-enrollment-card">
          <div className="empty-icon zero-enrollment-icon">
            <Icon name="lock" size={26} />
          </div>
          <h2 className="zero-enrollment-title">
            Weekly 20-Question MCQ Assessments are Course-Specific
          </h2>
          <p className="zero-enrollment-desc">
            Weekly multiple choice knowledge assessments are tailored specifically to your enrolled cohort track. Enroll in one of our specialized career tracks to unlock your 20-question weekly assessments, test your knowledge, and earn certified grades.
          </p>
          <div className="zero-enrollment-actions">
            <Link href="/courses" className="btn btn-orange zero-enrollment-btn">
              <span>Explore Programs &amp; Enroll</span>
              <Icon name="arrow" size={15} />
            </Link>
          </div>

          <div className="enrollment-motivation-card">
            <p className="enrollment-callout-text">
              ✨ Take the first step toward your tech career — <strong>enroll in an active specialization today</strong> to unlock weekly 20-question MCQ knowledge assessments, automated evaluations, and verified marks!
            </p>
            <div className="enrollment-quote-box">
              <blockquote className="enrollment-quote">
                “The expert in anything was once a beginner. The secret to getting ahead is getting started, testing your knowledge consistently, and never stopping the curiosity to learn.”
              </blockquote>
              <span className="enrollment-quote-author">— Sams Edutech Mentorship</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active question in modal
  const activeQuestions: McqQuestion[] = activeAssessment?.questions || [];
  const currentQuestion: McqQuestion | undefined = activeQuestions[currentQIndex];
  const activeAnsweredCount = Object.keys(answers).length;

  return (
    <div className="weekly-assessments-hub">
      {/* ── TOP KPI BANNER ── */}
      <div className="assessments-kpi-banner card">
        <div className="kpi-banner-header">
          <div>
            <div className="sec-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span className="live-dot" /> Cohort Weekly MCQ Knowledge Assessments
            </div>
            <h2 style={{ margin: "4px 0 6px", fontSize: "1.35rem", fontWeight: 800 }}>
              20-Question Multiple Choice Assessments
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
              Each weekly assessment contains 20 multiple choice questions with a 30-minute allocation to validate your foundational mastery and earn verifiable cohort grades.
            </p>
          </div>
          <div className="assessment-stat-pills">
            <div className="stat-pill">
              <span className="stat-val">{submittedCount}/{total}</span>
              <span className="stat-lbl">Completed</span>
            </div>
            <div className="stat-pill highlight">
              <span className="stat-val">{gradedCount > 0 ? `${scorePercent}%` : "Pending"}</span>
              <span className="stat-lbl">Average Score</span>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
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
            <span>{submittedCount} of {total} weekly MCQ assessments completed ({total > 0 ? Math.round((submittedCount / total) * 100) : 0}%)</span>
            <span>20 Questions per assessment &middot; Automated instant evaluation</span>
          </div>
        </div>
      </div>

      {/* ── COURSE TRACK FILTER BAR ── */}
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
            const isCompleted = Boolean(submission && submission.status === "graded");
            const score = submission?.score ?? 0;
            const correctCount = submission?.correct_count ?? Math.round((score / 100) * (assessment.questions?.length || 20));
            const passed = score >= (assessment.passing_points || 70);
            const deadline = formatTimeRemaining(assessment.due_date);

            return (
              <article key={assessment.id} className="card assessment-card">
                {/* Header Row */}
                <div className="assessment-card-top">
                  <div className="assessment-badges-row">
                    <span className="badge-week">Week {assessment.week_number}</span>
                    <span className="badge-course-track">{assessment.course_title}</span>
                    <span className="badge-difficulty">{assessment.difficulty}</span>
                    <span className="badge-points" style={{ background: "rgba(26, 111, 232, 0.1)", color: "var(--blue)" }}>
                      20 MCQs &middot; 30 Mins
                    </span>
                    <span className="badge-points">Pass: {assessment.passing_points || 70}%</span>
                  </div>
                  <div className="assessment-deadline-pill">
                    <Icon name="clock" size={14} />
                    <span className={deadline.overdue && !isCompleted ? "text-danger" : ""}>
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

                {/* Topics Tested / Objectives */}
                {assessment.objectives && assessment.objectives.length > 0 && (
                  <div className="assessment-section-box" style={{ marginTop: 14 }}>
                    <strong style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 6 }}>
                      Core Competencies &amp; Knowledge Areas Evaluated (20 Questions)
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                      {assessment.objectives.map((obj, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Status Footer */}
                <div className="assessment-footer-bar" style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  {isCompleted ? (
                    <div className="graded-summary-box">
                      <div className="graded-header">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span className={`grade-badge ${passed ? "grade-badge-success" : "grade-badge-warning"}`}>
                            <Icon name={passed ? "check" : "target"} size={14} />
                            {passed ? "Assessment Passed" : "Needs Retake"}
                          </span>
                          <span className="grade-score-pill">
                            Score: <strong>{correctCount} / 20</strong> ({score}%)
                          </span>
                          {submission?.grade && (
                            <span className="grade-letter-pill">Grade: {submission.grade}</span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                          Completed on {displayDate(submission?.graded_at || submission?.submitted_at || "")}
                        </span>
                      </div>

                      {submission?.feedback && (
                        <div className="grade-feedback-text" style={{ marginTop: 10 }}>
                          <strong>Evaluation Result:</strong>
                          <p style={{ margin: "4px 0 0" }}>{submission.feedback}</p>
                        </div>
                      )}

                      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openReviewModal(assessment)}
                        >
                          <Icon name="check" size={14} /> Review 20 Questions &amp; Answers
                        </button>
                        <button
                          type="button"
                          className="btn btn-orange btn-sm"
                          onClick={() => openTakeModal(assessment)}
                        >
                          <Icon name="spark" size={14} /> Retake Assessment
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="unsubmitted-status-box">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="status-pill status-pill-unsubmitted">Not Attempted</span>
                          <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
                            20 Multiple Choice Questions &middot; 30 Minutes
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-orange btn-sm"
                          onClick={() => openTakeModal(assessment)}
                        >
                          <span>Start 20-Question Assessment</span>
                          <Icon name="arrow" size={14} />
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

      {/* ── 20-QUESTION MCQ INTERACTIVE MODAL (TAKE & REVIEW) ── */}
      {activeAssessment && (
        <div className="modal-backdrop" onClick={() => !submitting && setActiveAssessment(null)}>
          <div
            className="modal-card modal-card-lg mcq-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 840, padding: "24px 28px" }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span className="badge-week">Week {activeAssessment.week_number}</span>
                  <span className="badge-course-track">{activeAssessment.course_title}</span>
                  <span className="badge-points" style={{ background: "rgba(26, 111, 232, 0.1)", color: "var(--blue)" }}>
                    20 Questions &middot; 30 Mins
                  </span>
                  {modalMode === "review" && (
                    <span className="badge-difficulty" style={{ background: "rgba(22, 163, 74, 0.15)", color: "#15803d" }}>
                      Review Mode
                    </span>
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                  {activeAssessment.title}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !submitting && setActiveAssessment(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {/* If submission success overlay is showing */}
            {submissionSuccess ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: submissionSuccess.passed ? "rgba(22, 163, 74, 0.15)" : "rgba(234, 88, 12, 0.15)",
                    color: submissionSuccess.passed ? "#16a34a" : "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Icon name={submissionSuccess.passed ? "check" : "target"} size={36} />
                </div>
                <h3 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 8px" }}>
                  {submissionSuccess.passed ? "Assessment Passed Successfully!" : "Assessment Completed"}
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.95rem", maxWidth: 480, margin: "0 auto 20px" }}>
                  {submissionSuccess.passed
                    ? "Great job! Your answers have been evaluated and your certified score has been recorded."
                    : "You completed all 20 questions. Review the concepts below and retake the assessment to reach the 70% passing threshold."}
                </p>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 20,
                    background: "var(--surface-2)",
                    padding: "14px 28px",
                    borderRadius: 12,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                      Score
                    </span>
                    <strong style={{ fontSize: "1.6rem", color: "var(--ink)" }}>
                      {submissionSuccess.correctCount} / {submissionSuccess.total}
                    </strong>
                  </div>
                  <div style={{ width: 1, height: 36, background: "var(--line)" }} />
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                      Percentage
                    </span>
                    <strong style={{ fontSize: "1.6rem", color: submissionSuccess.passed ? "#16a34a" : "#ea580c" }}>
                      {submissionSuccess.score}%
                    </strong>
                  </div>
                  <div style={{ width: 1, height: 36, background: "var(--line)" }} />
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                      Grade
                    </span>
                    <strong style={{ fontSize: "1.6rem", color: "var(--blue)" }}>
                      {submissionSuccess.grade}
                    </strong>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setModalMode("review");
                      setCurrentQIndex(0);
                    }}
                  >
                    <Icon name="check" size={15} /> Review Answers &amp; Explanations
                  </button>
                  <button
                    type="button"
                    className="btn btn-orange"
                    onClick={() => {
                      setActiveAssessment(null);
                      setSubmissionSuccess(null);
                    }}
                  >
                    Done &amp; Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {errorMsg && (
                  <div className="form-error" role="alert" style={{ margin: "14px 0 0" }}>
                    {errorMsg}
                  </div>
                )}

                {/* ── 20-QUESTION NAVIGATOR STRIP ── */}
                <div style={{ margin: "16px 0 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {modalMode === "review" ? "Question Review (20 Total)" : `Question Navigator: ${activeAnsweredCount} of 20 Answered`}
                    </span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--blue)" }}>
                      Question {currentQIndex + 1} of 20
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, 1fr)",
                      gap: 6,
                    }}
                  >
                    {activeQuestions.map((q, idx) => {
                      const isCurrent = idx === currentQIndex;
                      const isAnswered = typeof answers[q.id.toString()] === "number";
                      const studentPick = answers[q.id.toString()];
                      const isCorrect = studentPick === q.correct_answer;

                      let bg = "var(--surface-2)";
                      let color = "var(--ink)";
                      let borderColor = "var(--line)";

                      if (modalMode === "review") {
                        if (isCorrect) {
                          bg = "rgba(22, 163, 74, 0.15)";
                          color = "#15803d";
                          borderColor = "#16a34a";
                        } else {
                          bg = "rgba(239, 68, 68, 0.15)";
                          color = "#b91c1c";
                          borderColor = "#ef4444";
                        }
                      } else if (isAnswered) {
                        bg = "rgba(26, 111, 232, 0.15)";
                        color = "var(--blue)";
                        borderColor = "var(--blue)";
                      }

                      if (isCurrent) {
                        borderColor = "var(--orange)";
                      }

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentQIndex(idx)}
                          style={{
                            height: 34,
                            padding: 0,
                            borderRadius: 6,
                            border: `1.5px solid ${isCurrent ? "var(--orange)" : borderColor}`,
                            background: isCurrent ? (modalMode === "review" ? bg : "var(--orange-soft)") : bg,
                            color: isCurrent ? "var(--orange-dark)" : color,
                            fontWeight: isCurrent ? 800 : 700,
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          title={`Jump to Question ${idx + 1}${modalMode === "review" ? (isCorrect ? " (Correct)" : " (Incorrect)") : (isAnswered ? " (Answered)" : " (Unanswered)")}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── QUESTION DISPLAY CARD ── */}
                {currentQuestion && (
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: "20px 22px",
                      marginTop: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          color: "var(--blue)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Question {currentQIndex + 1} of 20
                      </span>
                      {modalMode === "review" && (
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 99,
                            background:
                              answers[currentQuestion.id.toString()] === currentQuestion.correct_answer
                                ? "rgba(22, 163, 74, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                            color:
                              answers[currentQuestion.id.toString()] === currentQuestion.correct_answer
                                ? "#15803d"
                                : "#b91c1c",
                          }}
                        >
                          {answers[currentQuestion.id.toString()] === currentQuestion.correct_answer
                            ? "Correct (+5 pts)"
                            : "Incorrect (0 pts)"}
                        </span>
                      )}
                    </div>

                    <h4
                      style={{
                        fontSize: "1.08rem",
                        fontWeight: 700,
                        lineHeight: 1.5,
                        margin: "0 0 18px",
                        color: "var(--ink)",
                      }}
                    >
                      {currentQuestion.question}
                    </h4>

                    {/* 4 Options */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {currentQuestion.options.map((optText, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                        const isSelected = answers[currentQuestion.id.toString()] === optIdx;
                        const isCorrect = currentQuestion.correct_answer === optIdx;

                        let optBorder = "var(--line)";
                        let optBg = "var(--white)";
                        let badgeColor = "var(--muted)";
                        let badgeBg = "var(--surface-2)";

                        if (modalMode === "review") {
                          if (isCorrect) {
                            optBorder = "#16a34a";
                            optBg = "rgba(22, 163, 74, 0.08)";
                            badgeBg = "#16a34a";
                            badgeColor = "#ffffff";
                          } else if (isSelected && !isCorrect) {
                            optBorder = "#ef4444";
                            optBg = "rgba(239, 68, 68, 0.08)";
                            badgeBg = "#ef4444";
                            badgeColor = "#ffffff";
                          }
                        } else if (isSelected) {
                          optBorder = "var(--orange)";
                          optBg = "rgba(255, 107, 0, 0.06)";
                          badgeBg = "var(--orange)";
                          badgeColor = "#ffffff";
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                              padding: "12px 16px",
                              borderRadius: 10,
                              border: `1.5px solid ${optBorder}`,
                              background: optBg,
                              cursor: modalMode === "review" ? "default" : "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <span
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: "50%",
                                background: badgeBg,
                                color: badgeColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.8rem",
                                fontWeight: 800,
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              {letter}
                            </span>
                            <div style={{ flex: 1, fontSize: "0.92rem", lineHeight: 1.45, color: "var(--ink)" }}>
                              {optText}
                            </div>
                            {modalMode === "review" && (
                              <div style={{ flexShrink: 0 }}>
                                {isCorrect && (
                                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#16a34a" }}>
                                    ✓ Correct Answer
                                  </span>
                                )}
                                {isSelected && !isCorrect && (
                                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#ef4444" }}>
                                    ✗ Your Selection
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Review Explanation */}
                    {modalMode === "review" && currentQuestion.explanation && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: "12px 16px",
                          borderRadius: 8,
                          background: "rgba(26, 111, 232, 0.08)",
                          borderLeft: "4px solid var(--blue)",
                        }}
                      >
                        <strong style={{ display: "block", fontSize: "0.8rem", color: "var(--blue)", marginBottom: 4 }}>
                          Concept &amp; Explanation:
                        </strong>
                        <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── MODAL FOOTER CONTROLS ── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: "1px solid var(--line)",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQIndex === 0}
                    >
                      &larr; Previous Question
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setCurrentQIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                      disabled={currentQIndex === activeQuestions.length - 1}
                    >
                      Next Question &rarr;
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {modalMode === "review" ? (
                      <button
                        type="button"
                        className="btn btn-orange btn-sm"
                        onClick={() => openTakeModal(activeAssessment)}
                      >
                        <Icon name="spark" size={14} /> Retake Assessment
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-orange btn-sm"
                        onClick={handleSubmitAssessment}
                        disabled={submitting}
                      >
                        <Icon name="check" size={14} />
                        {submitting
                          ? "Grading 20 Questions..."
                          : `Submit Assessment (${activeAnsweredCount}/20)`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
