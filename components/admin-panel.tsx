"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";
import { displayDate, displayDateTime } from "@/lib/utils";
import { COURSES } from "@/lib/courses";
import type {
  WeeklyAssessment,
  AssessmentSubmission,
  StudentProfileAdminView,
  AdminAuditLog,
  CoursePricingConfig,
  UpiPaymentRecord,
  UpiGatewayConfig,
} from "@/lib/types";

interface AdminPanelProps {
  initialAuthenticated: boolean;
  initialAssessments: WeeklyAssessment[];
  initialSubmissions: AssessmentSubmission[];
  initialStudents: StudentProfileAdminView[];
  initialAuditLogs: AdminAuditLog[];
  initialPricing?: Record<string, CoursePricingConfig>;
  initialPayments?: UpiPaymentRecord[];
  initialUpiConfig?: UpiGatewayConfig;
}

export function AdminPanel({
  initialAuthenticated,
  initialAssessments,
  initialSubmissions,
  initialStudents,
  initialAuditLogs,
  initialPricing = {},
  initialPayments = [],
  initialUpiConfig,
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
  const [activeTab, setActiveTab] = useState<
    "overview" | "assessments" | "submissions" | "students" | "pricing" | "payments" | "security"
  >("overview");

  // UPI Payments & Gateway state
  const [payments, setPayments] = useState<UpiPaymentRecord[]>(initialPayments);
  const [upiConfig, setUpiConfig] = useState<UpiGatewayConfig>(
    initialUpiConfig || {
      upi_id: "samsedutech@okaxis",
      payee_name: "Sams Edutech",
      qr_image_url: "/upi-qr-default.svg",
      auto_enroll: true,
      active: true,
    }
  );
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending_verification" | "verified" | "rejected">("all");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentActionLoading, setPaymentActionLoading] = useState<string | null>(null);
  const [paymentFeedback, setPaymentFeedback] = useState("");
  const [savingUpiSettings, setSavingUpiSettings] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [upiSettingsFeedback, setUpiSettingsFeedback] = useState("");
  const [previewReceipt, setPreviewReceipt] = useState<{ url: string; student: string; utr: string } | null>(null);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [editUpiId, setEditUpiId] = useState(initialUpiConfig?.upi_id || "samsedutech@okaxis");
  const [editPayeeName, setEditPayeeName] = useState(initialUpiConfig?.payee_name || "Sams Edutech");
  const [editAutoEnroll, setEditAutoEnroll] = useState(initialUpiConfig?.auto_enroll ?? false);
  const [editInstructions, setEditInstructions] = useState(initialUpiConfig?.instructions || "");

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

  // Edit Assessment state
  const [editingAssessment, setEditingAssessment] = useState<WeeklyAssessment | null>(null);
  const [editWeek, setEditWeek] = useState(1);
  const [editCourseId, setEditCourseId] = useState("");
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [editMaxPoints, setEditMaxPoints] = useState(100);
  const [editDueDate, setEditDueDate] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editObjectives, setEditObjectives] = useState("");
  const [updatingAssessment, setUpdatingAssessment] = useState(false);
  const [editAssessmentError, setEditAssessmentError] = useState("");

  // Course Pricing state
  const [pricingMap, setPricingMap] = useState<Record<string, CoursePricingConfig>>(() => {
    const map: Record<string, CoursePricingConfig> = { ...initialPricing };
    COURSES.forEach((c) => {
      if (!map[c.slug]) {
        const isCloud = c.slug === "fullstack-web-cloud-development";
        const is3Month = c.slug === "fullstack-web-development-accelerator";
        map[c.slug] = {
          slug: c.slug,
          price: c.price ?? (is3Month ? 19999 : isCloud ? 26000 : 23999),
          original_price: c.original_price ?? (is3Month ? 24000 : isCloud ? 30000 : 28000),
          discount_percent: c.discount_percent ?? (is3Month ? 17 : isCloud ? 13 : 14),
          active: true,
        };
      }
    });
    return map;
  });
  const [savingPricingSlug, setSavingPricingSlug] = useState<string | null>(null);
  const [pricingFeedback, setPricingFeedback] = useState<string>("");

  // Submissions & Grading state
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>(initialSubmissions);
  const [gradingSubmission, setGradingSubmission] = useState<AssessmentSubmission | null>(null);
  const [inspectingSubmission, setInspectingSubmission] = useState<AssessmentSubmission | null>(null);
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

  // ── UPI PAYMENT HANDLERS ──
  async function handleVerifyPayment(paymentId: string, action: "verify" | "reject") {
    setPaymentActionLoading(paymentId);
    setPaymentFeedback("");
    try {
      const res = await fetch("/api/admin/upi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPaymentFeedback(data.error || "Failed to update payment status.");
        return;
      }
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? (data.payment as UpiPaymentRecord) : p))
      );
      setPaymentFeedback(data.message);
    } catch {
      setPaymentFeedback("Network error updating payment verification.");
    } finally {
      setPaymentActionLoading(null);
    }
  }

  // Bulk Verification Handlers
  async function handleBulkVerify(action: "verify" | "reject") {
    if (selectedPaymentIds.length === 0) return;
    const confirmPrompt =
      action === "verify"
        ? `Are you sure you want to approve ${selectedPaymentIds.length} payment(s) and unlock courses for all selected students?`
        : `Are you sure you want to reject ${selectedPaymentIds.length} payment(s)? Access will be revoked.`;
    if (!window.confirm(confirmPrompt)) return;

    setBulkActionLoading(true);
    setPaymentFeedback("");
    try {
      const res = await fetch("/api/admin/upi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_ids: selectedPaymentIds, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPaymentFeedback(data.error || "Failed to process bulk payments.");
        return;
      }
      if (Array.isArray(data.payments)) {
        const updatedMap = new Map<string, UpiPaymentRecord>(data.payments.map((p: UpiPaymentRecord) => [p.id, p]));
        setPayments((prev) => prev.map((p) => (updatedMap.has(p.id) ? updatedMap.get(p.id)! : p)));
      }
      setPaymentFeedback(data.message || `Processed ${selectedPaymentIds.length} payment(s).`);
      setSelectedPaymentIds([]);
    } catch {
      setPaymentFeedback("Network error during bulk payment verification.");
    } finally {
      setBulkActionLoading(false);
    }
  }

  function handleToggleSelect(paymentId: string) {
    setSelectedPaymentIds((prev) =>
      prev.includes(paymentId) ? prev.filter((id) => id !== paymentId) : [...prev, paymentId]
    );
  }

  function handleSelectAllVisible() {
    const visibleIds = filteredPayments.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedPaymentIds.includes(id));
    if (allSelected) {
      setSelectedPaymentIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedPaymentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  }

  function handleSelectAllPending() {
    const pendingIds = payments.filter((p) => p.status === "pending_verification").map((p) => p.id);
    setSelectedPaymentIds(pendingIds);
  }

  async function handleSaveUpiSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingUpiSettings(true);
    setUpiSettingsFeedback("");
    try {
      const res = await fetch("/api/admin/upi/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upi_id: editUpiId,
          payee_name: editPayeeName,
          auto_enroll: editAutoEnroll,
          instructions: editInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setUpiSettingsFeedback(data.error || "Failed to save settings.");
        return;
      }
      setUpiConfig(data.config);
      setUpiSettingsFeedback("UPI Gateway settings saved successfully!");
    } catch {
      setUpiSettingsFeedback("Network error saving UPI settings.");
    } finally {
      setSavingUpiSettings(false);
    }
  }

  async function handleQrImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    setUpiSettingsFeedback("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upi/upload-qr", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setUpiSettingsFeedback(data.error || "Failed to upload QR image.");
        return;
      }
      setUpiConfig(data.config);
      setUpiSettingsFeedback("Personal UPI QR code uploaded and activated for all students!");
    } catch {
      setUpiSettingsFeedback("Network error uploading QR image.");
    } finally {
      setUploadingQr(false);
      e.target.value = "";
    }
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

  function openEditAssessment(a: WeeklyAssessment) {
    setEditingAssessment(a);
    setEditWeek(a.week_number);
    setEditCourseId(a.course_id);
    setEditCourseTitle(a.course_title);
    setEditTitle(a.title);
    setEditDifficulty(a.difficulty);
    setEditMaxPoints(a.max_points);
    setEditDueDate(a.due_date ? a.due_date.slice(0, 10) : "");
    setEditDesc(a.description);
    setEditObjectives((a.objectives || []).join("\n"));
    setEditAssessmentError("");
  }

  async function handleUpdateAssessment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAssessment) return;
    setEditAssessmentError("");
    setUpdatingAssessment(true);
    try {
      const res = await fetch("/api/admin/assessments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAssessment.id,
          week_number: Number(editWeek),
          course_id: editCourseId,
          course_title: editCourseTitle,
          title: editTitle,
          difficulty: editDifficulty,
          max_points: Number(editMaxPoints),
          due_date: new Date(editDueDate).toISOString(),
          description: editDesc,
          objectives: editObjectives.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update assessment.");

      setAssessments((prev) =>
        prev.map((item) => (item.id === editingAssessment.id ? data.assessment : item))
      );
      setEditingAssessment(null);
      router.refresh();
    } catch (err: unknown) {
      setEditAssessmentError(err instanceof Error ? err.message : "Error updating assessment");
    } finally {
      setUpdatingAssessment(false);
    }
  }

  // ── COURSE PRICING HANDLERS ──
  function updatePricingField(slug: string, field: "original_price" | "discount_percent", value: number) {
    setPricingMap((prev) => {
      const current = prev[slug] || {
        slug,
        price: 499,
        original_price: 799,
        discount_percent: 35,
        active: true,
      };
      const updated = { ...current, [field]: value };
      const orig = field === "original_price" ? value : updated.original_price;
      const disc = field === "discount_percent" ? value : updated.discount_percent;
      updated.price = Math.max(0, Math.round(orig * (1 - disc / 100)));
      return { ...prev, [slug]: updated };
    });
  }

  async function handleSavePricing(slug: string) {
    const config = pricingMap[slug];
    if (!config) return;
    setSavingPricingSlug(slug);
    setPricingFeedback("");
    try {
      const res = await fetch("/api/admin/courses/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save pricing");
      setPricingFeedback(`Pricing for ${slug} updated successfully!`);
      setTimeout(() => setPricingFeedback(""), 4000);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving course price");
    } finally {
      setSavingPricingSlug(null);
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
          (a.slug && a.slug.includes(assessmentCourseFilter)) ||
          (a.course_title && a.course_title.toLowerCase().includes(assessmentCourseFilter.toLowerCase()))
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
          (parent.slug && parent.slug.includes(submissionCourseFilter)) ||
          (parent.course_title && parent.course_title.toLowerCase().includes(submissionCourseFilter.toLowerCase()));
        if (!matches) return false;
      }
    }
    return true;
  });

  // Filtered students (safe against null fields in Supabase profiles)
  const filteredStudents = students.filter((st) => {
    if (!searchStudent.trim()) return true;
    const q = searchStudent.toLowerCase();
    return (
      (st.full_name && st.full_name.toLowerCase().includes(q)) ||
      (st.email && st.email.toLowerCase().includes(q)) ||
      (st.username && st.username.toLowerCase().includes(q)) ||
      (st.phone_number && st.phone_number.toLowerCase().includes(q))
    );
  });

  const pendingPaymentsCount = payments.filter((p) => p.status === "pending_verification").length;
  const verifiedPayments = payments.filter((p) => p.status === "verified");
  const totalUpiRevenue = verifiedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Filtered payments (safe against null fields)
  const filteredPayments = payments.filter((p) => {
    if (paymentFilter !== "all" && p.status !== paymentFilter) return false;
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase().trim();
      return (
        (p.utr_number && p.utr_number.toLowerCase().includes(q)) ||
        (p.student_name && p.student_name.toLowerCase().includes(q)) ||
        (p.student_email && p.student_email.toLowerCase().includes(q)) ||
        (p.course_title && p.course_title.toLowerCase().includes(q)) ||
        (p.sender_upi_id && p.sender_upi_id.toLowerCase().includes(q))
      );
    }
    return true;
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
            className={`admin-tab-btn ${activeTab === "pricing" ? "active" : ""}`}
            onClick={() => setActiveTab("pricing")}
          >
            <Icon name="spark" size={15} /> Course Pricing &amp; Discounts
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <Icon name="check" size={15} /> UPI Payments &amp; Gateway
            {pendingPaymentsCount > 0 && (
              <span className="admin-count-pill" style={{ background: "var(--orange)", color: "#fff" }}>
                {pendingPaymentsCount} pending
              </span>
            )}
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

              <div className="card admin-kpi-card" onClick={() => setActiveTab("payments")} style={{ cursor: "pointer" }}>
                <span className="kpi-icon-wrap bg-green"><Icon name="check" size={18} /></span>
                <div>
                  <div className="admin-kpi-num">₹{totalUpiRevenue.toLocaleString("en-IN")}</div>
                  <div className="admin-kpi-label">UPI Collections</div>
                  <div className="admin-kpi-hint">{pendingPaymentsCount} pending verification</div>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="card admin-quick-actions" style={{ marginTop: 22, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Instant Executive Actions</h3>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.84rem" }}>
                    Publish new assessments, review student payments, or inspect student records immediately.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActiveTab("payments")}
                  >
                    <Icon name="check" size={15} /> Review Payments ({pendingPaymentsCount})
                  </button>
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
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.84rem" }}>Latest assessments submitted by cohort members</p>
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
                  Create and publish weekly assessments for student cohorts. Published assessments appear instantaneously on the student dashboard.
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
                          <td><strong>{a.max_points}</strong>{" "}pts</td>
                          <td>{displayDate(a.due_date)}</td>
                          <td><span className="pill-sub-count">{count} submitted</span></td>
                          <td>
                            <span className="status-pill status-pill-green">Published</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => openEditAssessment(a)}
                                title="Edit weekly assessment"
                              >
                                Edit
                              </button>
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
                        <label>Core Objectives &amp; Tested Competencies (One per line)</label>
                        <textarea
                          rows={2}
                          value={newObjectives}
                          onChange={(e) => setNewObjectives(e.target.value)}
                        />
                      </div>

                      <div className="field full">
                        <div style={{ background: "rgba(26, 111, 232, 0.08)", padding: "12px 16px", borderRadius: 8, borderLeft: "4px solid var(--blue)" }}>
                          <strong style={{ display: "block", fontSize: "0.82rem", color: "var(--blue)", marginBottom: 4 }}>
                            Automated 20-Question MCQ Format
                          </strong>
                          <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                            This assessment generates 20 multiple choice questions with four options each and automated scoring against a 70% passing threshold (30-minute allocation). No manual repository or file upload is required.
                          </span>
                        </div>
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

            {/* EDIT ASSESSMENT MODAL */}
            {editingAssessment && (
              <div className="modal-backdrop" onClick={() => !updatingAssessment && setEditingAssessment(null)}>
                <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <span className="sec-eyebrow">Modify Curriculum &amp; Timeline</span>
                      <h3 style={{ margin: "2px 0 0", fontSize: "1.25rem", fontWeight: 800 }}>
                        Edit Weekly Assessment: Week {editingAssessment.week_number}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => !updatingAssessment && setEditingAssessment(null)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleUpdateAssessment} style={{ marginTop: 18 }}>
                    {editAssessmentError && <div className="form-error" role="alert" style={{ marginBottom: 14 }}>{editAssessmentError}</div>}

                    <div className="form-grid">
                      <div className="field">
                        <label>Week Number *</label>
                        <input
                          type="number"
                          min={1}
                          max={52}
                          value={editWeek}
                          onChange={(e) => setEditWeek(Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="field">
                        <label>Associated Program Track *</label>
                        <select
                          value={editCourseId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditCourseId(val);
                            const found = COURSES.find((c) => c.slug === val);
                            if (found) setEditCourseTitle(found.title);
                            else if (val === "all") setEditCourseTitle("Universal Cohort Track");
                          }}
                        >
                          <option value="all">Universal Cohort Track (All Programs)</option>
                          {COURSES.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.title} ({c.duration_months} Months)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field full">
                        <label>Assessment Title *</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="e.g. SOC Lab: Incident Triage & Sigma Rules"
                          required
                        />
                      </div>

                      <div className="field">
                        <label>Difficulty Tier</label>
                        <select
                          value={editDifficulty}
                          onChange={(e) => setEditDifficulty(e.target.value as "Beginner" | "Intermediate" | "Advanced")}
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
                          value={editMaxPoints}
                          onChange={(e) => setEditMaxPoints(Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="field">
                        <label>Due Date *</label>
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field full">
                        <label>Problem Description &amp; Scenario *</label>
                        <textarea
                          rows={3}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field full">
                        <label>Key Learning Objectives &amp; Knowledge Areas (one per line)</label>
                        <textarea
                          rows={2}
                          value={editObjectives}
                          onChange={(e) => setEditObjectives(e.target.value)}
                        />
                      </div>

                      <div className="field full">
                        <div style={{ background: "rgba(26, 111, 232, 0.08)", padding: "12px 16px", borderRadius: 8, borderLeft: "4px solid var(--blue)" }}>
                          <strong style={{ display: "block", fontSize: "0.82rem", color: "var(--blue)", marginBottom: 4 }}>
                            20 Multiple Choice Questions (30-Minute Allocation)
                          </strong>
                          <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                            Evaluated automatically using the objective question bank and instant grading threshold (70% pass requirement).
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: 20 }}>
                      <button
                        type="submit"
                        className="btn btn-orange"
                        disabled={updatingAssessment}
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {updatingAssessment ? "Saving Changes..." : "Save Assessment Changes"}
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
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Student Submissions &amp; MCQ Evaluation Hub</h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                  Review automated 20-question MCQ knowledge scores, inspect individual student choices, calibrate grades, and publish encrypted mentor feedback.
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
                        <th>MCQ Score &amp; Status</th>
                        <th>Submitted At</th>
                        <th>Evaluation Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((sub) => {
                        const parent = assessments.find((a) => a.id === sub.assessment_id);
                        const correctCount = sub.correct_count ?? Math.round(((sub.score ?? 0) / 100) * 20);
                        const passed = (sub.score ?? 0) >= (parent?.passing_points || 70);

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
                                <span style={{ color: "var(--blue)", fontWeight: 700 }}>{parent?.course_title}</span> &middot; 20 MCQs
                              </div>
                            </td>
                            <td>
                              <div>
                                <span className="score-pill-grade" style={{ fontSize: "0.92rem", fontWeight: 800 }}>
                                  {correctCount}/20 ({sub.score ?? 0}%)
                                </span>
                                <div style={{ marginTop: 4 }}>
                                  <span
                                    className={`status-pill ${passed ? "status-pill-green" : "status-pill-orange"}`}
                                    style={{ fontSize: "0.74rem", padding: "2px 8px" }}
                                  >
                                    Grade: {sub.grade || (passed ? "Pass" : "Needs Revision")}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{displayDateTime(sub.submitted_at)}</td>
                            <td>
                              {sub.status === "graded" ? (
                                <div>
                                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink)" }}>
                                    {sub.graded_by || "MCQ Auto-Evaluation"}
                                  </span>
                                  {sub.feedback && (
                                    <div className="small-hint" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={sub.feedback}>
                                      {sub.feedback}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="status-pill status-pill-orange">Awaiting Review</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setInspectingSubmission(sub)}
                                  title="Inspect student's answers to all 20 MCQs"
                                >
                                  Review Answers
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-orange btn-sm"
                                  onClick={() => openGradingModal(sub)}
                                >
                                  {sub.status === "graded" ? "Edit Grade" : "Grade"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* MCQ STUDENT ANSWER REVIEW MODAL */}
            {inspectingSubmission && (() => {
              const parent = assessments.find((a) => a.id === inspectingSubmission.assessment_id);
              const questions = parent?.questions || [];
              const rawAnswers = inspectingSubmission.answers || {};
              const correct = inspectingSubmission.correct_count ?? Math.round(((inspectingSubmission.score ?? 0) / 100) * (questions.length || 20));
              const score = inspectingSubmission.score ?? 0;
              const passed = score >= (parent?.passing_points || 70);

              return (
                <div className="modal-backdrop" onClick={() => setInspectingSubmission(null)}>
                  <div
                    className="modal-card modal-card-lg"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: 840, maxHeight: "90vh", overflowY: "auto", padding: "24px 28px" }}
                  >
                    <div className="modal-header" style={{ paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className="badge-week">Week {parent?.week_number || 1}</span>
                          <span className="badge-course-track">{parent?.course_title}</span>
                          <span className="badge-points" style={{ background: "rgba(26, 111, 232, 0.1)", color: "var(--blue)" }}>
                            20 Multiple Choice Questions
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                          Student MCQ Answers: {inspectingSubmission.student_name}
                        </h3>
                        <div className="small-hint">{inspectingSubmission.student_email}</div>
                      </div>
                      <button
                        type="button"
                        className="modal-close-btn"
                        onClick={() => setInspectingSubmission(null)}
                        aria-label="Close"
                      >
                        &times;
                      </button>
                    </div>

                    {/* Summary KPI Banner */}
                    <div
                      style={{
                        margin: "18px 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 20px",
                        background: "var(--surface-2)",
                        borderRadius: 10,
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                          Score: {correct} / {questions.length || 20} ({score}%)
                        </span>
                        <span
                          className={`status-pill ${passed ? "status-pill-green" : "status-pill-orange"}`}
                          style={{ fontSize: "0.8rem", padding: "3px 10px" }}
                        >
                          Grade: {inspectingSubmission.grade || (passed ? "Pass" : "Needs Revision")}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        Submitted {displayDateTime(inspectingSubmission.submitted_at)}
                      </span>
                    </div>

                    {/* 20 Questions Inspection List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
                      {questions.length === 0 ? (
                        <p style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>
                          No question data available for this assessment.
                        </p>
                      ) : (
                        questions.map((q, idx) => {
                          const studentChoice = rawAnswers[q.id.toString()];
                          const hasAnswered = typeof studentChoice === "number";
                          const isCorrect = studentChoice === q.correct_answer;

                          return (
                            <div
                              key={q.id}
                              style={{
                                border: `1.5px solid ${!hasAnswered ? "var(--line)" : isCorrect ? "rgba(22, 163, 74, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                                borderRadius: 10,
                                padding: "14px 18px",
                                background: !hasAnswered ? "var(--surface)" : isCorrect ? "rgba(22, 163, 74, 0.04)" : "rgba(239, 68, 68, 0.04)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <strong style={{ fontSize: "0.85rem", color: "var(--blue)" }}>
                                  Question {idx + 1} of {questions.length}
                                </strong>
                                <span
                                  style={{
                                    fontSize: "0.76rem",
                                    fontWeight: 800,
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                    background: isCorrect ? "rgba(22, 163, 74, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                    color: isCorrect ? "#15803d" : "#b91c1c",
                                  }}
                                >
                                  {isCorrect ? "✓ Correct (+5 pts)" : "✗ Incorrect (0 pts)"}
                                </span>
                              </div>

                              <p style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: 600, color: "var(--ink)" }}>
                                {q.question}
                              </p>

                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {q.options.map((opt, optIdx) => {
                                  const letter = String.fromCharCode(65 + optIdx);
                                  const isOptCorrect = optIdx === q.correct_answer;
                                  const isOptChosen = studentChoice === optIdx;

                                  let optBg = "var(--white)";
                                  let optBorder = "var(--line)";
                                  if (isOptCorrect) {
                                    optBg = "rgba(22, 163, 74, 0.1)";
                                    optBorder = "#16a34a";
                                  } else if (isOptChosen && !isOptCorrect) {
                                    optBg = "rgba(239, 68, 68, 0.1)";
                                    optBorder = "#ef4444";
                                  }

                                  return (
                                    <div
                                      key={optIdx}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "8px 12px",
                                        borderRadius: 6,
                                        border: `1px solid ${optBorder}`,
                                        background: optBg,
                                        fontSize: "0.86rem",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <strong style={{ color: "var(--muted)", width: 18 }}>[{letter}]</strong>
                                        <span style={{ color: "var(--ink)" }}>{opt}</span>
                                      </div>
                                      <div>
                                        {isOptCorrect && (
                                          <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#16a34a" }}>
                                            ✓ Correct
                                          </span>
                                        )}
                                        {isOptChosen && !isOptCorrect && (
                                          <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#ef4444" }}>
                                            ✗ Student Choice
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {q.explanation && (
                                <div style={{ marginTop: 8, fontSize: "0.8rem", color: "var(--muted)", fontStyle: "italic" }}>
                                  Explanation: {q.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div style={{ marginTop: 18, textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setInspectingSubmission(null)}
                      >
                        Close Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

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
                  Complete access to all student profiles, enrollment progress, submitted assessments, and certified performance records.
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
              {filteredStudents.length === 0 ? (
                <div className="empty" style={{ padding: 48, textAlign: "center" }}>
                  <Icon name="user" size={32} />
                  <h3 style={{ marginTop: 12 }}>No Registered Students Found</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.88rem", maxWidth: 460, margin: "8px auto 0" }}>
                    Real student accounts will appear here automatically when learners sign up via Supabase authentication. All dummy/demo data has been removed.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student Identity</th>
                        <th>Role &amp; Verification</th>
                        <th>Enrolled Programs</th>
                        <th>Assessments</th>
                        <th>Average Score</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((st) => (
                        <tr key={st.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className="mini-avatar" style={{ overflow: "hidden" }}>
                                {st.avatar_url ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={st.avatar_url} alt={st.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  st.full_name ? st.full_name.slice(0, 2).toUpperCase() : "ST"
                                )}
                              </div>
                              <div>
                                <strong>{st.full_name}</strong>
                                <div className="small-hint">{st.email}</div>
                                {st.phone_number && (
                                  <div className="small-hint" style={{ color: "var(--blue)", fontWeight: 600 }}>
                                    {st.phone_number}
                                  </div>
                                )}
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
                            <strong>{st.submissions_count}</strong>{" "}submitted
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
              )}
            </div>

            {/* STUDENT DOSSIER MODAL */}
            {selectedStudent && (
              <div className="modal-backdrop" onClick={() => setSelectedStudent(null)}>
                <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div className="mini-avatar" style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0, fontSize: "1rem" }}>
                        {selectedStudent.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={selectedStudent.avatar_url} alt={selectedStudent.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          selectedStudent.full_name ? selectedStudent.full_name.slice(0, 2).toUpperCase() : "ST"
                        )}
                      </div>
                      <div>
                        <span className="sec-eyebrow">Student Identity Dossier</span>
                        <h3 style={{ margin: "2px 0 0", fontSize: "1.3rem", fontWeight: 800 }}>
                          {selectedStudent.full_name}
                        </h3>
                        <div className="small-hint">
                          {selectedStudent.email}
                          {selectedStudent.phone_number ? ` • Mobile: ${selectedStudent.phone_number}` : ""}
                          {` • Member since ${displayDate(selectedStudent.created_at)}`}
                        </div>
                      </div>
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

        {/* ── TAB 5: COURSE PRICING & DISCOUNTS ── */}
        {activeTab === "pricing" && (
          <div>
            <div className="section-bar" style={{ marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Course Pricing &amp; Percentage Discounts</h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                  Adjust tuition prices, promotional discount percentages, and active deals across all programs in real-time without modifying website source code.
                </p>
              </div>
              {pricingFeedback && (
                <div className="status-pill status-pill-green" style={{ padding: "8px 14px", fontWeight: 700 }}>
                  <Icon name="check" size={14} /> {pricingFeedback}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              {COURSES.map((course) => {
                const isCloud = course.slug === "fullstack-web-cloud-development";
                const is3Month = course.slug === "fullstack-web-development-accelerator";
                const conf = pricingMap[course.slug] || {
                  slug: course.slug,
                  price: course.price ?? (is3Month ? 19999 : isCloud ? 26000 : 23999),
                  original_price: course.original_price ?? (is3Month ? 24000 : isCloud ? 30000 : 28000),
                  discount_percent: course.discount_percent ?? (is3Month ? 17 : isCloud ? 13 : 14),
                  active: true,
                };
                const isSaving = savingPricingSlug === course.slug;

                return (
                  <div key={course.slug} className="card" style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span className={`plan-pill ${course.duration_months === 4 ? "plan-pill-comprehensive" : "plan-pill-accelerator"}`}>
                          {course.duration_months} Months Plan
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>
                          {course.category}
                        </span>
                      </div>
                      <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 800 }}>{course.title}</h3>
                      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem", maxWidth: 650 }}>
                        {course.description}
                      </p>

                      {/* Live Price Preview */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)" }}>Student Live Price:</span>
                        <span style={{ fontSize: "1.45rem", fontWeight: 900, color: "var(--blue)" }}>
                          ₹{conf.price.toLocaleString("en-IN")}
                        </span>
                        {conf.original_price > conf.price && (
                          <span style={{ fontSize: "1rem", color: "var(--muted)", textDecoration: "line-through", fontWeight: 600 }}>
                            ₹{conf.original_price.toLocaleString("en-IN")}
                          </span>
                        )}
                        {conf.discount_percent > 0 && (
                          <span className="discount-pill">
                            {conf.discount_percent}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing Edit Form Controls */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 18, minWidth: 280 }}>
                      <div style={{ display: "grid", gap: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
                            Original Price (₹ INR)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={conf.original_price}
                            onChange={(e) => updatePricingField(course.slug, "original_price", Number(e.target.value))}
                            style={{ width: "100%", height: 38 }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
                            Discount Percentage (%)
                          </label>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={conf.discount_percent}
                              onChange={(e) => updatePricingField(course.slug, "discount_percent", Number(e.target.value))}
                              style={{ width: "100%", height: 38 }}
                            />
                            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--muted)" }}>%</span>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
                            Calculated Final Price (₹ INR)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={conf.price}
                            onChange={(e) => {
                              const p = Number(e.target.value);
                              setPricingMap((prev) => ({
                                ...prev,
                                [course.slug]: {
                                  ...conf,
                                  price: p,
                                },
                              }));
                            }}
                            style={{ width: "100%", height: 38, fontWeight: 800, color: "var(--blue)" }}
                          />
                        </div>

                        <button
                          type="button"
                          className="btn btn-orange btn-sm"
                          disabled={isSaving}
                          onClick={() => handleSavePricing(course.slug)}
                          style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                        >
                          {isSaving ? "Saving Live Changes..." : "Save Pricing & Discount"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 5: UPI PAYMENTS & GATEWAY ── */}
        {activeTab === "payments" && (
          <div>
            <div className="section-bar" style={{ marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>
                  UPI Payments &amp; Gateway Settings
                </h2>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                  Verify student 12-digit UTR payment transactions, unlock/revoke course enrollments, and upload your personal UPI QR scanner.
                </p>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="admin-kpi-row" style={{ marginBottom: 24 }}>
              <div className="card admin-kpi-card">
                <span className="kpi-icon-wrap bg-green"><Icon name="check" size={18} /></span>
                <div>
                  <div className="admin-kpi-num">₹{totalUpiRevenue.toLocaleString("en-IN")}</div>
                  <div className="admin-kpi-label">Verified UPI Revenue</div>
                  <div className="admin-kpi-hint">{verifiedPayments.length} student payments</div>
                </div>
              </div>

              <div className="card admin-kpi-card">
                <span className="kpi-icon-wrap bg-orange"><Icon name="spark" size={18} /></span>
                <div>
                  <div className="admin-kpi-num">{pendingPaymentsCount}</div>
                  <div className="admin-kpi-label">Pending Verification</div>
                  <div className="admin-kpi-hint">Cross-check UTR with bank app</div>
                </div>
              </div>

              <div className="card admin-kpi-card">
                <span className="kpi-icon-wrap bg-blue"><Icon name="grid" size={18} /></span>
                <div>
                  <div className="admin-kpi-num">{payments.length}</div>
                  <div className="admin-kpi-label">Total Transactions</div>
                  <div className="admin-kpi-hint">All recorded submissions</div>
                </div>
              </div>

              <div className="card admin-kpi-card">
                <span className="kpi-icon-wrap bg-purple"><Icon name="shield" size={18} /></span>
                <div>
                  <div className="admin-kpi-num" style={{ fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {upiConfig.upi_id}
                  </div>
                  <div className="admin-kpi-label">Active UPI VPA</div>
                  <div className="admin-kpi-hint">{upiConfig.auto_enroll ? "Auto-Enroll ON" : "Manual Approval"}</div>
                </div>
              </div>
            </div>

            {/* Main 2-Column Grid */}
            <div className="upi-admin-grid">
              {/* Left Column: Submissions Queue */}
              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Student Payment Transactions</h3>
                    <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.82rem" }}>
                      Cross-verify the student&apos;s 12-digit UTR against your GPay / PhonePe / Paytm bank transaction history.
                    </p>
                  </div>

                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search UTR, student, email..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    style={{ height: 36, width: 230, fontSize: "0.82rem" }}
                  />
                </div>

                {/* Filter Tabs & Bulk Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                    {(["all", "pending_verification", "verified", "rejected"] as const).map((filterKey) => (
                      <button
                        key={filterKey}
                        type="button"
                        className={`btn btn-secondary ${paymentFilter === filterKey ? "active" : ""}`}
                        onClick={() => setPaymentFilter(filterKey)}
                        style={{
                          padding: "5px 12px",
                          fontSize: "0.78rem",
                          borderColor: paymentFilter === filterKey ? "var(--blue)" : "var(--line)",
                          background: paymentFilter === filterKey ? "var(--blue-soft)" : "transparent",
                          color: paymentFilter === filterKey ? "var(--blue)" : "var(--muted)",
                        }}
                      >
                        {filterKey === "all"
                          ? `All (${payments.length})`
                          : filterKey === "pending_verification"
                          ? `Pending (${pendingPaymentsCount})`
                          : filterKey === "verified"
                          ? `Verified (${verifiedPayments.length})`
                          : `Rejected (${payments.filter((p) => p.status === "rejected").length})`}
                      </button>
                    ))}
                  </div>

                  {pendingPaymentsCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "5px 12px", fontSize: "0.78rem", color: "var(--orange)", borderColor: "var(--orange)" }}
                      onClick={handleSelectAllPending}
                    >
                      ⚡ Select All Pending ({pendingPaymentsCount})
                    </button>
                  )}
                </div>

                {/* Bulk Action Toolbar */}
                {selectedPaymentIds.length > 0 && (
                  <div
                    style={{
                      padding: "10px 16px",
                      background: "var(--blue-soft, rgba(0, 102, 204, 0.08))",
                      border: "1px solid var(--blue)",
                      borderRadius: 8,
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem", fontWeight: 700 }}>
                      <Icon name="check" size={16} />
                      <span>{selectedPaymentIds.length} payment(s) selected</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: "6px 14px", fontSize: "0.8rem", background: "var(--green)", borderColor: "var(--green)" }}
                        disabled={bulkActionLoading}
                        onClick={() => handleBulkVerify("verify")}
                      >
                        {bulkActionLoading ? "Processing..." : `✓ Bulk Confirm & Unlock (${selectedPaymentIds.length})`}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "0.8rem", color: "var(--red)" }}
                        disabled={bulkActionLoading}
                        onClick={() => handleBulkVerify("reject")}
                      >
                        ✗ Bulk Reject ({selectedPaymentIds.length})
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "6px 10px", fontSize: "0.76rem" }}
                        disabled={bulkActionLoading}
                        onClick={() => setSelectedPaymentIds([])}
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                )}

                {paymentFeedback && (
                  <div className="form-success" style={{ marginBottom: 14 }}>
                    {paymentFeedback}
                  </div>
                )}

                {/* Table */}
                {filteredPayments.length === 0 ? (
                  <div className="empty-state" style={{ padding: "36px 0" }}>
                    <div className="empty-icon"><Icon name="check" size={24} /></div>
                    <strong>No payments found</strong>
                    <span>No transactions match the selected filter.</span>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: 36, textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={filteredPayments.length > 0 && filteredPayments.every((p) => selectedPaymentIds.includes(p.id))}
                              onChange={handleSelectAllVisible}
                              title="Select or deselect all visible payments"
                              style={{ cursor: "pointer", width: 16, height: 16 }}
                            />
                          </th>
                          <th>Student</th>
                          <th>Course</th>
                          <th>Amount</th>
                          <th>12-Digit UTR</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((p) => (
                          <tr key={p.id}>
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={selectedPaymentIds.includes(p.id)}
                                onChange={() => handleToggleSelect(p.id)}
                                style={{ cursor: "pointer", width: 15, height: 15 }}
                              />
                            </td>
                            <td>
                              <strong>{p.student_name}</strong>
                              <div style={{ fontSize: "0.76rem", color: "var(--muted)" }}>{p.student_email}</div>
                              {p.student_phone && <div style={{ fontSize: "0.74rem", color: "var(--muted)" }}>{p.student_phone}</div>}
                            </td>
                            <td>
                              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{p.course_title}</span>
                            </td>
                            <td>
                              <strong style={{ color: "var(--ink)" }}>₹{Number(p.amount).toLocaleString("en-IN")}</strong>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <code style={{ fontWeight: 700, fontSize: "0.88rem" }}>{p.utr_number}</code>
                                <button
                                  type="button"
                                  className="btn-copy-upi"
                                  style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                                  onClick={() => navigator.clipboard.writeText(p.utr_number)}
                                  title="Copy UTR to clipboard"
                                >
                                  Copy
                                </button>
                              </div>
                              {p.sender_upi_id && (
                                <div style={{ fontSize: "0.74rem", color: "var(--muted)", marginTop: 2 }}>
                                  Via: {p.sender_upi_id}
                                </div>
                              )}
                              {p.screenshot_url && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: "2px 7px", fontSize: "0.72rem", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--blue)" }}
                                  onClick={() => setPreviewReceipt({ url: p.screenshot_url!, student: p.student_name, utr: p.utr_number })}
                                >
                                  <Icon name="spark" size={12} /> View Receipt
                                </button>
                              )}
                            </td>
                            <td>
                              <span className={`payment-status-badge status-${p.status}`}>
                                {p.status === "verified" ? "VERIFIED" : p.status === "pending_verification" ? "PENDING" : "REJECTED"}
                              </span>
                            </td>
                            <td style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                              {displayDate(p.created_at)}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {p.status !== "verified" && (
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ padding: "4px 10px", fontSize: "0.74rem", background: "var(--green)", borderColor: "var(--green)" }}
                                    onClick={() => handleVerifyPayment(p.id, "verify")}
                                    disabled={paymentActionLoading === p.id}
                                  >
                                    Confirm
                                  </button>
                                )}
                                {p.status !== "rejected" && (
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: "4px 8px", fontSize: "0.74rem", color: "var(--red)" }}
                                    onClick={() => handleVerifyPayment(p.id, "reject")}
                                    disabled={paymentActionLoading === p.id}
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Personal QR & Gateway Config */}
              <div style={{ display: "grid", gap: 20 }}>
                {/* Personal QR Upload Card */}
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800 }}>Personal UPI QR Code</h3>
                  <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: "0.8rem" }}>
                    Upload your personal Google Pay, PhonePe, or Paytm QR code image. It immediately updates for all student checkouts.
                  </p>

                  <div className="upi-qr-preview-card">
                    <Image
                      src={upiConfig.qr_image_url}
                      alt="Current Active QR Code"
                      width={180}
                      height={180}
                      className="upi-qr-preview-img"
                      unoptimized
                    />
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      Active Scanner: <code>{upiConfig.qr_image_url}</code>
                    </div>

                    <label className="qr-upload-dropzone">
                      <Icon name="spark" size={18} />
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", marginTop: 4, color: "var(--blue)" }}>
                        {uploadingQr ? "Uploading QR Code..." : "Click to Upload New QR Image"}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--muted)" }}>PNG, JPG, WebP from phone/computer</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrImageUpload}
                        disabled={uploadingQr}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>

                {/* Gateway Parameters Form */}
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", fontWeight: 800 }}>Gateway Credentials</h3>

                  <form onSubmit={handleSaveUpiSettings}>
                    <div className="field" style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Payee UPI ID / VPA</label>
                      <input
                        type="text"
                        placeholder="e.g. yourname@okhdfcbank"
                        value={editUpiId}
                        onChange={(e) => setEditUpiId(e.target.value)}
                        required
                        style={{ height: 38 }}
                      />
                    </div>

                    <div className="field" style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Payee Business Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sams Edutech"
                        value={editPayeeName}
                        onChange={(e) => setEditPayeeName(e.target.value)}
                        required
                        style={{ height: 38 }}
                      />
                    </div>

                    <div className="field" style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Course Access Mode</label>
                      <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.8rem", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="autoEnroll"
                            checked={editAutoEnroll === false}
                            onChange={() => setEditAutoEnroll(false)}
                            style={{ marginTop: 3 }}
                          />
                          <span><strong>Manual Approval (Recommended &bull; 100% Anti-Fraud)</strong>{" "}&mdash; Keep course locked until you cross-check bank app/SMS and click Confirm. Zero risk of fake UTR brute-forcing.</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.8rem", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="autoEnroll"
                            checked={editAutoEnroll === true}
                            onChange={() => setEditAutoEnroll(true)}
                            style={{ marginTop: 3 }}
                          />
                          <span><strong>Instant Auto-Enroll Mode</strong>{" "}&mdash; Course unlocks immediately on 12-digit UTR submission. Requires manual audits or bank webhook to catch forged reference numbers.</span>
                        </label>
                      </div>
                    </div>

                    <div className="field" style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700 }}>Payment Instructions for Students</label>
                      <textarea
                        rows={2}
                        value={editInstructions}
                        onChange={(e) => setEditInstructions(e.target.value)}
                        placeholder="Instructions displayed to students in checkout modal..."
                        style={{ fontSize: "0.8rem", padding: "8px 10px", width: "100%", borderRadius: "8px", border: "1px solid var(--line)" }}
                      />
                    </div>

                    {upiSettingsFeedback && (
                      <div className="form-success" style={{ marginBottom: 12, fontSize: "0.82rem" }}>
                        {upiSettingsFeedback}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-orange"
                      style={{ width: "100%", justifyContent: "center" }}
                      disabled={savingUpiSettings}
                    >
                      {savingUpiSettings ? "Saving Settings..." : "Save Gateway Settings"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Student Payment Receipt Preview Modal */}
            {previewReceipt && (
              <div className="payment-modal-backdrop" onClick={() => setPreviewReceipt(null)}>
                <div className="payment-modal-card" style={{ maxWidth: 520, textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header" style={{ marginBottom: 14 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Payment Receipt Proof</h3>
                      <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
                        {previewReceipt.student} &bull; UTR: <code>{previewReceipt.utr}</code>
                      </p>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={() => setPreviewReceipt(null)} aria-label="Close">
                      &times;
                    </button>
                  </div>
                  <div style={{ maxHeight: "70vh", overflowY: "auto", borderRadius: 8, border: "1px solid var(--line)" }}>
                    <Image
                      src={previewReceipt.url}
                      alt="Student payment receipt"
                      width={500}
                      height={700}
                      style={{ width: "100%", height: "auto", display: "block" }}
                      unoptimized
                    />
                  </div>
                  <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setPreviewReceipt(null)}>
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 6: SECURITY & AUDIT LOGS ── */}
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
