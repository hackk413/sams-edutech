"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";
import { displayDate, displayDateTime } from "@/lib/utils";
import { COURSES } from "@/lib/courses";
import type {
  WeeklyAssessment,
  AssessmentSubmission,
  StudentProfileAdminView,
  AdminAuditLog,
} from "@/lib/types";

interface AdminPanelProps {
  initialAuthenticated: boolean;
  initialAssessments: WeeklyAssessment[];
  initialSubmissions: AssessmentSubmission[];
  initialStudents: StudentProfileAdminView[];
  initialAuditLogs: AdminAuditLog[];
}

export function AdminPanel({
  initialAuthenticated,
  initialAssessments,
  initialSubmissions,
  initialStudents,
  initialAuditLogs,
}: AdminPanelProps) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [passkey, setPasskey] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (authenticated) {
      document.body.classList.add("in-admin-dashboard");
      return () => {
        document.body.classList.remove("in-admin-dashboard");
      };
    } else {
      document.body.classList.remove("in-admin-dashboard");
    }
  }, [authenticated]);

  // Active module tab
  const [activeTab, setActiveTab] = useState<"overview" | "assessments" | "submissions" | "students" | "security">("overview");

  // Assessments state
  const [assessments, setAssessments] = useState<WeeklyAssessment[]>(initialAssessments);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Course-specific filters & form state
  const [assessmentCourseFilter, setAssessmentCourseFilter] = useState("all");
  const [submissionCourseFilter, setSubmissionCourseFilter] = useState("all");
  const [newCourseId, setNewCourseId] = useState(COURSES[0].slug);
  const [newWeek, setNewWeek] = useState(assessments.length + 1);
  const [newTitle, setNewTitle] = useState("");
  const [newTrack, setNewTrack] = useState(COURSES[0].title);
  const [newDifficulty, setNewDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [newMaxPoints, setNewMaxPoints] = useState(100);
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [newDesc, setNewDesc] = useState("");
  const [newObjectives, setNewObjectives] = useState("Map target attack surface\nExecute defensive audit");
  const [newDeliverables, setNewDeliverables] = useState("GitHub repository with code\nPDF summary of findings");
  const [newRepoUrl, setNewRepoUrl] = useState("");

  // Submissions & Grading state
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>(initialSubmissions);
  const [gradingSubmission, setGradingSubmission] = useState<AssessmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(90);
  const [gradeLetter, setGradeLetter] = useState("A+");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);
  const [subFilter, setSubFilter] = useState<"all" | "pending" | "graded">("all");

  // Students state
  const [students] = useState<StudentProfileAdminView[]>(initialStudents);
  const [searchStudent, setSearchStudent] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfileAdminView | null>(null);

  // Logs
  const [auditLogs] = useState<AdminAuditLog[]>(initialAuditLogs);

  // ── AUTH HANDLERS ──
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Access denied.");
      setAuthenticated(true);
      router.refresh();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
    router.refresh();
  }

  // ── ASSESSMENT HANDLERS ──
  async function handleCreateAssessment(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_number: Number(newWeek),
          course_id: newCourseId,
          course_title: newTrack,
          title: newTitle,
          difficulty: newDifficulty,
          max_points: Number(newMaxPoints),
          due_date: new Date(newDueDate).toISOString(),
          description: newDesc,
          objectives: newObjectives.split("\n").map((s) => s.trim()).filter(Boolean),
          deliverables: newDeliverables.split("\n").map((s) => s.trim()).filter(Boolean),
          starter_repo_url: newRepoUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish assessment.");

      setAssessments((prev) => [...prev, data.assessment]);
      setShowCreateModal(false);
      // Reset
      setNewTitle("");
      setNewDesc("");
      router.refresh();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error creating assessment");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteAssessment(id: string) {
    if (!confirm("Are you sure you want to delete this weekly assessment?")) return;
    try {
      await fetch(`/api/admin/assessments?id=${id}`, { method: "DELETE" });
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch {
      alert("Could not delete assessment.");
    }
  }

  // ── GRADING HANDLERS ──
  function openGradingModal(sub: AssessmentSubmission) {
    setGradingSubmission(sub);
    setGradeScore(sub.score || 90);
    setGradeLetter(sub.grade || "A+");
    setGradeFeedback(sub.feedback || "Excellent work on this lab. Requirements met with clean documentation.");
  }

  async function handleSaveGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!gradingSubmission) return;
    setSavingGrade(true);
    try {
      const res = await fetch("/api/admin/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: gradingSubmission.id,
          score: Number(gradeScore),
          grade: gradeLetter,
          feedback: gradeFeedback,
          status: "graded",
          graded_by: "Head Mentor & Admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record grade.");

      setSubmissions((prev) =>
        prev.map((s) => (s.id === gradingSubmission.id ? data.submission : s))
      );
      setGradingSubmission(null);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Could not submit grade.");
    } finally {
      setSavingGrade(false);
    }
  }

  // ── IF NOT AUTHENTICATED: RENDER SECURE GATEWAY ──
  if (!authenticated) {
    return (
      <div className="admin-gate-page">
        <div className="admin-gate-card card">
          <div className="gate-header">
            <div className="gate-shield-pulse">
              <Icon name="shield" size={32} />
            </div>
            <BrandLogo href="/" size="normal" />
            <h1 style={{ margin: "16px 0 4px", fontSize: "1.4rem", fontWeight: 800 }}>
              Admin Command Center
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.86rem", margin: 0 }}>
              Restricted portal for faculty, mentors &amp; executive administrators.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ marginTop: 24 }}>
            {loginError && <div className="form-error" role="alert" style={{ marginBottom: 14 }}>{loginError}</div>}

            <div className="field">
              <label htmlFor="admin-passkey">Master Admin Passkey</label>
              <input
                id="admin-passkey"
                type="password"
                placeholder="Enter admin authorization key"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-orange"
              disabled={loggingIn}
              style={{ width: "100%", justifyContent: "center", marginTop: 18 }}
            >
              {loggingIn ? "Verifying Credentials..." : <><span>Authorize Admin Access</span> <Icon name="arrow" size={15} /></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filtered assessments by course
  const filteredAssessments = assessmentCourseFilter === "all"
    ? assessments
    : assessments.filter(
        (a) =>
          a.course_id === assessmentCourseFilter ||
          a.slug.includes(assessmentCourseFilter) ||
          a.course_title.toLowerCase().includes(assessmentCourseFilter.toLowerCase())
      );

  // Filtered submissions by status and course
  const filteredSubmissions = submissions.filter((s) => {
    if (subFilter === "pending" && !(s.status === "submitted" || s.status === "under_review")) return false;
    if (subFilter === "graded" && s.status !== "graded") return false;
    if (submissionCourseFilter !== "all") {
      const parent = assessments.find((a) => a.id === s.assessment_id);
      if (parent) {
        const matches =
          parent.course_id === submissionCourseFilter ||
          parent.slug.includes(submissionCourseFilter) ||
          parent.course_title.toLowerCase().includes(submissionCourseFilter.toLowerCase());
        if (!matches) return false;
      }
    }
    return true;
  });

  // Filtered students
  const filteredStudents = students.filter((st) => {
    const q = searchStudent.toLowerCase();
    return (
      st.full_name.toLowerCase().includes(q) ||
      st.email.toLowerCase().includes(q) ||
      (st.username && st.username.toLowerCase().includes(q))
    );
  });

  const pendingCount = submissions.filter((s) => s.status === "submitted" || s.status === "under_review").length;

  return (
    <div className="admin-console-page">
      {/* ── ADMIN TOP BAR ── */}
      <header className="admin-console-topbar">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BrandLogo href="/admin" size="normal" />
            <span className="admin-badge-live">
              <span className="live-dot" /> ADMIN CONSOLE
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="admin-operator-tag">
              <Icon name="shield" size={14} /> Master Administrator
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              title="Sign out of admin console"
            >
              Lock Console
            </button>
          </div>
        </div>
      </header>

      {/* ── ADMIN SUB NAV TABS ── */}
      <div className="admin-tabs-bar">
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto" }}>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Icon name="grid" size={15} /> Overview &amp; Analytics
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "assessments" ? "active" : ""}`}
            onClick={() => setActiveTab("assessments")}
          >
            <Icon name="target" size={15} /> Weekly Assessments ({assessments.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "submissions" ? "active" : ""}`}
            onClick={() => setActiveTab("submissions")}
          >
            <Icon name="spark" size={15} /> Submissions Queue
            {pendingCount > 0 && <span className="admin-count-pill">{pendingCount} new</span>}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            <Icon name="user" size={15} /> Student Profiles ({students.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <Icon name="shield" size={15} /> Encryption &amp; Audit Logs
          </button>
        </div>
      </div>

      <main className="container" style={{ padding: "26px 0 60px" }}>
        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="admin-overview-grid">
            <div className="admin-kpi-row">
              <div className="card admin-kpi-card">
                <span className="kpi-icon-wrap bg-blue"><Icon name="user" size={18} /></span>
                <div>
                  <div className="admin-kpi-num">{students.length}</div>
                  <div className="admin-kpi-label">Registered Students</div>
                  <div className="admin-kpi-hint">Active cohort directory</div>
                </div>
              </div>

              <div className="card admin-kpi-card">
                <span className="kpi-icon-wrap bg-orange"><Icon name="target" size={18} /></span>
                <div>
                  <div className="admin-kpi-num">{assessments.length}</div>
                  <div className="admin-kpi-label">Weekly Assessments</div>
                  <div className="admin-kpi-hint">Published for cohort</div>
                </div>
              </div>

              <div className="card admin-kpi-card">
                <span className="kpi-icon-wrap bg-purple"><Icon name="spark" size={18} /></span>
                <div>
                  <div className="admin-kpi-num">{submissions.length}</div>
                  <div className="admin-kpi-label">Total Submissions</div>
                  <div className="admin-kpi-hint">{pendingCount} awaiting evaluation</div>
                </div>
              </div>

              <div className="card admin-kpi-card">
                <span className="kpi-icon-wrap bg-green"><Icon name="check" size={18} /></span>
                <div>
                  <div className="admin-kpi-num">92%</div>
                  <div className="admin-kpi-label">Cohort Passing Rate</div>
                  <div className="admin-kpi-hint">Across verified modules</div>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="card admin-quick-actions" style={{ marginTop: 22, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Instant Executive Actions</h3>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.84rem" }}>
                    Publish new assessments, grade pending submissions, or inspect student records immediately.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-orange btn-sm"
                    onClick={() => { setActiveTab("assessments"); setShowCreateModal(true); }}
                  >
                    <Icon name="spark" size={14} /> + Publish Weekly Assessment
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setActiveTab("submissions"); setSubFilter("pending"); }}
                  >
                    Grade Queue ({pendingCount})
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setActiveTab("students")}
                  >
                    Search Students
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Submissions Feed */}
            <div className="card" style={{ marginTop: 22, padding: "22px 26px" }}>
              <div className="section-bar" style={{ marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Recent Student Submissions</h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.84rem" }}>Latest assignments submitted by cohort members</p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setActiveTab("submissions")}
                >
                  View All Submissions &rarr;
                </button>
              </div>

              {submissions.length === 0 ? (
                <div className="empty" style={{ padding: 24 }}>No submissions recorded yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Assessment</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.slice(0, 5).map((sub) => {
                        const parent = assessments.find((a) => a.id === sub.assessment_id);
                        return (
                          <tr key={sub.id}>
                            <td>
                              <strong>{sub.student_name}</strong>
                              <div className="small-hint">{sub.student_email}</div>
                            </td>
                            <td>{parent?.title || sub.assessment_id}</td>
                            <td>{displayDate(sub.submitted_at)}</td>
                            <td>
                              <span className={`status-pill ${sub.status === "graded" ? "status-pill-green" : "status-pill-orange"}`}>
                                {sub.status === "graded" ? `Graded (${sub.score}/100)` : "Pending Review"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => { setActiveTab("submissions"); openGradingModal(sub); }}
                              >
                                {sub.status === "graded" ? "Review / Re-grade" : "Grade Now"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: WEEKLY ASSESSMENTS PUBLISHER ── */}
        {activeTab === "assessments" && (
          <div>
            <div className="section-bar" style={{ marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Weekly Assessment Manager</h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                  Create and publish weekly assignments for student cohorts. Published assessments appear instantaneously on the student dashboard.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-orange"
                onClick={() => setShowCreateModal(true)}
              >
                <Icon name="spark" size={15} /> + New Weekly Assessment
              </button>
            </div>

            {/* Filter by Course Track */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)" }}>Program Track:</span>
              <button
                type="button"
                className={`filter-chip ${assessmentCourseFilter === "all" ? "active" : ""}`}
                onClick={() => setAssessmentCourseFilter("all")}
              >
                All Programs ({assessments.length})
              </button>
              {COURSES.map((course) => {
                const count = assessments.filter(
                  (a) =>
                    a.course_id === course.slug ||
                    a.course_id === course.id ||
                    a.course_title.toLowerCase().includes(course.title.toLowerCase())
                ).length;
                return (
                  <button
                    key={course.slug}
                    type="button"
                    className={`filter-chip ${assessmentCourseFilter === course.slug ? "active" : ""}`}
                    onClick={() => setAssessmentCourseFilter(course.slug)}
                  >
                    {course.title.split("(")[0].trim()} ({count})
                  </button>
                );
              })}
            </div>

            <div className="assessments-admin-table-card card" style={{ padding: 20 }}>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Title &amp; Track</th>
                      <th>Difficulty</th>
                      <th>Points</th>
                      <th>Due Date</th>
                      <th>Submissions</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessments.map((a) => {
                      const count = submissions.filter((s) => s.assessment_id === a.id).length;
                      return (
                        <tr key={a.id}>
                          <td><span className="badge-week">Week {a.week_number}</span></td>
                          <td>
                            <strong>{a.title}</strong>
                            <div className="small-hint">{a.course_title}</div>
                          </td>
                          <td><span className="badge-difficulty">{a.difficulty}</span></td>
                          <td><strong>{a.max_points}</strong> pts</td>
                          <td>{displayDate(a.due_date)}</td>
                          <td><span className="pill-sub-count">{count} submitted</span></td>
                          <td>
                            <span className="status-pill status-pill-green">Published</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-danger"
                                onClick={() => handleDeleteAssessment(a.id)}
                                title="Delete assessment"
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CREATE ASSESSMENT MODAL */}
            {showCreateModal && (
              <div className="modal-backdrop" onClick={() => !creating && setShowCreateModal(false)}>
                <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <span className="sec-eyebrow">Cohort Curriculum Publishing</span>
                      <h3 style={{ margin: "2px 0 0", fontSize: "1.25rem", fontWeight: 800 }}>
                        Publish New Weekly Assessment
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => !creating && setShowCreateModal(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleCreateAssessment} style={{ marginTop: 18 }}>
                    {createError && <div className="form-error" role="alert" style={{ marginBottom: 14 }}>{createError}</div>}

                    <div className="form-grid">
                      <div className="field">
                        <label>Week Number *</label>
                        <input
                          type="number"
                          min={1}
                          max={52}
                          value={newWeek}
                          onChange={(e) => setNewWeek(Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="field">
                        <label>Associated Program Track *</label>
                        <select
                          value={newCourseId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewCourseId(val);
                            const found = COURSES.find((c) => c.slug === val);
                            if (found) setNewTrack(found.title);
                          }}
                        >
                          {COURSES.map((course) => (
                            <option key={course.slug} value={course.slug}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field full">
                        <label>Assessment Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Week 4: SIEM Detection Engineering & Alert Rules"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field">
                        <label>Difficulty</label>
                        <select
                          value={newDifficulty}
                          onChange={(e) => setNewDifficulty(e.target.value as "Beginner" | "Intermediate" | "Advanced")}
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>

                      <div className="field">
                        <label>Maximum Points</label>
                        <input
                          type="number"
                          min={10}
                          max={500}
                          value={newMaxPoints}
                          onChange={(e) => setNewMaxPoints(Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="field">
                        <label>Submission Due Date *</label>
                        <input
                          type="date"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field">
                        <label>Starter Lab Repository URL (Optional)</label>
                        <input
                          type="url"
                          placeholder="https://github.com/samsedutech-labs/starter"
                          value={newRepoUrl}
                          onChange={(e) => setNewRepoUrl(e.target.value)}
                        />
                      </div>

                      <div className="field full">
                        <label>Assessment Detailed Description *</label>
                        <textarea
                          rows={3}
                          placeholder="Explain the background, challenge scenario, engineering tasks, and scoring guidelines..."
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field full">
                        <label>Core Objectives (One per line)</label>
                        <textarea
                          rows={2}
                          value={newObjectives}
                          onChange={(e) => setNewObjectives(e.target.value)}
                        />
                      </div>

                      <div className="field full">
                        <label>Required Deliverables (One per line)</label>
                        <textarea
                          rows={2}
                          value={newDeliverables}
                          onChange={(e) => setNewDeliverables(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: 20 }}>
                      <button
                        type="submit"
                        className="btn btn-orange"
                        disabled={creating}
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {creating ? "Broadcasting to Cohort..." : "Publish Assessment Instantly"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: SUBMISSIONS & GRADING QUEUE ── */}
        {activeTab === "submissions" && (
          <div>
            <div className="section-bar" style={{ marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Student Submissions &amp; Grading Hub</h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                  Inspect student code, verify deliverables, assign verified grades, and publish encrypted mentor feedback.
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={`filter-chip ${subFilter === "all" ? "active" : ""}`}
                  onClick={() => setSubFilter("all")}
                >
                  All ({submissions.length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${subFilter === "pending" ? "active" : ""}`}
                  onClick={() => setSubFilter("pending")}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${subFilter === "graded" ? "active" : ""}`}
                  onClick={() => setSubFilter("graded")}
                >
                  Graded ({submissions.length - pendingCount})
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)" }}>Program Track:</span>
              <button
                type="button"
                className={`filter-chip ${submissionCourseFilter === "all" ? "active" : ""}`}
                onClick={() => setSubmissionCourseFilter("all")}
              >
                All Programs
              </button>
              {COURSES.map((course) => (
                <button
                  key={course.slug}
                  type="button"
                  className={`filter-chip ${submissionCourseFilter === course.slug ? "active" : ""}`}
                  onClick={() => setSubmissionCourseFilter(course.slug)}
                >
                  {course.title.split("(")[0].trim()}
                </button>
              ))}
            </div>

            <div className="card" style={{ padding: 20 }}>
              {filteredSubmissions.length === 0 ? (
                <div className="empty" style={{ padding: 36, textAlign: "center" }}>
                  <Icon name="check" size={28} />
                  <h3 style={{ marginTop: 12 }}>Grading queue is clear!</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>All student submissions have been evaluated and verified.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student Details</th>
                        <th>Weekly Assessment</th>
                        <th>Solution Repository</th>
                        <th>Submitted At</th>
                        <th>Evaluation</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((sub) => {
                        const parent = assessments.find((a) => a.id === sub.assessment_id);
                        return (
                          <tr key={sub.id}>
                            <td>
                              <strong>{sub.student_name}</strong>
                              <div className="small-hint">{sub.student_email}</div>
                              {sub.notes && (
                                <div className="student-note-preview" title={sub.notes}>
                                  &ldquo;{sub.notes.slice(0, 50)}...&rdquo;
                                </div>
                              )}
                            </td>
                            <td>
                              <strong>{parent?.title || sub.assessment_id}</strong>
                              <div className="small-hint">
                                <span style={{ color: "var(--blue)", fontWeight: 700 }}>{parent?.course_title}</span> &middot; Max: {parent?.max_points || 100} pts
                              </div>
                            </td>
                            <td>
                              <a
                                href={sub.github_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
                              >
                                <Icon name="arrow" size={12} /> View Code
                              </a>
                              {sub.demo_url && (
                                <div style={{ marginTop: 4 }}>
                                  <a href={sub.demo_url} target="_blank" rel="noreferrer" className="small-link">
                                    Live Demo &rarr;
                                  </a>
                                </div>
                              )}
                            </td>
                            <td>{displayDateTime(sub.submitted_at)}</td>
                            <td>
                              {sub.status === "graded" ? (
                                <div>
                                  <span className="score-pill-grade">
                                    {sub.score}/{parent?.max_points || 100} ({sub.grade})
                                  </span>
                                  <div className="small-hint">by {sub.graded_by}</div>
                                </div>
                              ) : (
                                <span className="status-pill status-pill-orange">Awaiting Review</span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-orange btn-sm"
                                onClick={() => openGradingModal(sub)}
                              >
                                {sub.status === "graded" ? "Re-grade" : "Grade & Feedback"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* GRADING DIALOG */}
            {gradingSubmission && (
              <div className="modal-backdrop" onClick={() => !savingGrade && setGradingSubmission(null)}>
                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <span className="sec-eyebrow">Mentor Evaluation &amp; Feedback</span>
                      <h3 style={{ margin: "2px 0 0", fontSize: "1.2rem", fontWeight: 800 }}>
                        Grading: {gradingSubmission.student_name}
                      </h3>
                      <div className="small-hint">
                        <strong style={{ color: "var(--blue)" }}>{assessments.find((a) => a.id === gradingSubmission.assessment_id)?.course_title}</strong> &middot; {assessments.find((a) => a.id === gradingSubmission.assessment_id)?.title}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => !savingGrade && setGradingSubmission(null)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleSaveGrade} style={{ marginTop: 18 }}>
                    <div className="form-grid">
                      <div className="field">
                        <label>Score (Points out of 100)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={gradeScore}
                          onChange={(e) => setGradeScore(Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="field">
                        <label>Grade Letter</label>
                        <select
                          value={gradeLetter}
                          onChange={(e) => setGradeLetter(e.target.value)}
                        >
                          <option>A+</option>
                          <option>A</option>
                          <option>B+</option>
                          <option>B</option>
                          <option>Pass</option>
                          <option>Needs Revision</option>
                        </select>
                      </div>

                      <div className="field full">
                        <label>Personalized Mentor Feedback &amp; Review (AES-256-GCM Encrypted)</label>
                        <textarea
                          rows={4}
                          placeholder="Provide constructive feedback, praise strong implementation choices, or suggest specific areas for growth..."
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                          required
                        />
                        <span className="field-hint">
                          Feedback is cryptographically encrypted in transit and at rest before delivery to student dashboard.
                        </span>
                      </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: 18 }}>
                      <button
                        type="submit"
                        className="btn btn-orange"
                        disabled={savingGrade}
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {savingGrade ? "Encrypting & Storing Grade..." : "Publish Grade & Notify Student"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: STUDENT PROFILES DIRECTORY ── */}
        {activeTab === "students" && (
          <div>
            <div className="section-bar" style={{ marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Student Profiles &amp; Cohort Directory</h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                  Complete access to all student profiles, enrollment progress, submitted assignments, and certified performance records.
                </p>
              </div>

              <div style={{ minWidth: 260 }}>
                <input
                  type="text"
                  placeholder="Search by student name or email..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  style={{ height: "40px" }}
                />
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Identity</th>
                      <th>Role &amp; Verification</th>
                      <th>Enrolled Programs</th>
                      <th>Assignments</th>
                      <th>Average Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((st) => (
                      <tr key={st.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="mini-avatar">
                              {st.full_name ? st.full_name.slice(0, 2).toUpperCase() : "ST"}
                            </div>
                            <div>
                              <strong>{st.full_name}</strong>
                              <div className="small-hint">{st.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="status-badge-verified">
                            <Icon name="check" size={11} /> {st.role === "admin" ? "Admin" : "Verified Student"}
                          </span>
                        </td>
                        <td>
                          {st.enrolled_courses.length === 0 ? (
                            <span className="small-hint">No active courses</span>
                          ) : (
                            st.enrolled_courses.map((c) => (
                              <div key={c.id} className="small-course-chip">
                                {c.title} ({c.progress}%)
                              </div>
                            ))
                          )}
                        </td>
                        <td>
                          <strong>{st.submissions_count}</strong> submitted
                          <div className="small-hint">{st.graded_count} graded</div>
                        </td>
                        <td>
                          {st.average_score !== null ? (
                            <strong style={{ color: "var(--blue)" }}>{st.average_score}%</strong>
                          ) : (
                            <span className="small-hint">Pending</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedStudent(st)}
                          >
                            Inspect Dossier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* STUDENT DOSSIER MODAL */}
            {selectedStudent && (
              <div className="modal-backdrop" onClick={() => setSelectedStudent(null)}>
                <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <span className="sec-eyebrow">Student Identity Dossier</span>
                      <h3 style={{ margin: "2px 0 0", fontSize: "1.3rem", fontWeight: 800 }}>
                        {selectedStudent.full_name}
                      </h3>
                      <div className="small-hint">{selectedStudent.email} &bull; Member since {displayDate(selectedStudent.created_at)}</div>
                    </div>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setSelectedStudent(null)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <div className="dossier-bio-box">
                      <div className="box-title">Student Profile Bio:</div>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--ink-secondary)" }}>
                        {selectedStudent.bio || "No custom bio provided by student."}
                      </p>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <div className="box-title" style={{ marginBottom: 8 }}>Enrolled Courses &amp; Milestones:</div>
                      {selectedStudent.enrolled_courses.map((c) => (
                        <div key={c.id} className="dossier-course-row">
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700 }}>
                            <span>{c.title}</span>
                            <span>{c.progress}% completed</span>
                          </div>
                          <div className="progress-track" style={{ height: "6px", marginTop: 4 }}>
                            <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <div className="box-title" style={{ marginBottom: 8 }}>Private Mentor Evaluation Notes:</div>
                      <div className="mentor-notes-card">
                        <Icon name="shield" size={14} />
                        <span>{selectedStudent.mentor_notes || "Student performing consistently across foundational and advanced lab tracks."}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: SECURITY & AUDIT LOGS ── */}
        {activeTab === "security" && (
          <div>
            <div className="section-bar" style={{ marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>System Security &amp; Cryptographic Console</h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                  Active cryptographic safeguards, cipher modes, and immutable administrative audit trail.
                </p>
              </div>
            </div>

            <div className="security-cards-grid">
              <div className="card sec-feature-card">
                <div className="sec-feat-icon bg-green"><Icon name="shield" size={18} /></div>
                <h4>AES-256-GCM Payload Cipher</h4>
                <p>All sensitive student feedback and notes are encrypted with 96-bit unique IVs and 128-bit authentication tags to prevent eavesdropping and ciphertext tampering.</p>
                <span className="sec-feat-tag status-pill-green">ACTIVE &bull; HARDENED</span>
              </div>

              <div className="card sec-feature-card">
                <div className="sec-feat-icon bg-blue"><Icon name="spark" size={18} /></div>
                <h4>Timing-Safe Key Verification</h4>
                <p>Passkey comparisons utilize constant-time buffer evaluations via <code>crypto.timingSafeEqual</code> to eliminate microsecond timing side-channel attacks.</p>
                <span className="sec-feat-tag status-pill-green">ACTIVE &bull; HARDENED</span>
              </div>

              <div className="card sec-feature-card">
                <div className="sec-feat-icon bg-purple"><Icon name="lock" size={18} /></div>
                <h4>HMAC-SHA256 Signed Sessions</h4>
                <p>Admin sessions are secured via cryptographically signed tokens with strict 12-hour expiry and SameSite HttpOnly cookie isolation.</p>
                <span className="sec-feat-tag status-pill-green">ACTIVE &bull; HARDENED</span>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="card" style={{ marginTop: 24, padding: 22 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1.15rem", fontWeight: 800 }}>Immutable Administrative Audit Trail</h3>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Operator</th>
                      <th>Details</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{displayDateTime(log.timestamp)}</td>
                        <td><code>{log.action}</code></td>
                        <td><strong>{log.adminId}</strong></td>
                        <td>{log.details}</td>
                        <td>
                          <span className={`status-pill ${log.severity === "security" ? "status-pill-red" : log.severity === "warning" ? "status-pill-orange" : "status-pill-green"}`}>
                            {log.severity.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
