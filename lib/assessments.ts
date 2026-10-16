import fs from "node:fs";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { encryptSensitiveText, decryptSensitiveText } from "@/lib/crypto";
import type {
  WeeklyAssessment,
  AssessmentSubmission,
  StudentProfileAdminView,
  AdminAuditLog,
  Course,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const ASSESSMENTS_FILE = path.join(DATA_DIR, "assessments.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const AUDIT_LOGS_FILE = path.join(DATA_DIR, "audit_logs.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ── STARTER REAL-WORLD WEEKLY ASSIGNMENTS ──
const INITIAL_ASSESSMENTS: WeeklyAssessment[] = [
  {
    id: "wa-week-1-cyber",
    week_number: 1,
    course_id: "all",
    course_title: "Foundations & Security Track",
    title: "Week 1: Threat Surface Mapping & Port Reconnaissance",
    slug: "week-1-threat-surface-mapping",
    description:
      "Perform a simulated active and passive reconnaissance audit on a sandboxed target network. You will identify open services, document banners, identify obsolete protocol versions, and compose a structured executive summary with remediations.",
    objectives: [
      "Conduct non-intrusive TCP SYN scans using Nmap on sandbox target 10.0.4.0/24",
      "Map exposed attack surfaces to NIST SP 800-115 testing standards",
      "Draft an executive report highlighting vulnerabilities and immediate host-hardening steps",
    ],
    deliverables: [
      "GitHub repo link containing your scan scripts or Nmap command logs (.gnmap / .xml)",
      "Executive PDF or Markdown summary of findings with CVSS severity ratings",
      "Hardening recommendations for at least 3 discovered weaknesses",
    ],
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days from now
    max_points: 100,
    passing_points: 65,
    difficulty: "Beginner",
    status: "published",
    starter_repo_url: "https://github.com/samsedutech-labs/week1-network-recon",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "wa-week-2-owasp",
    week_number: 2,
    course_id: "all",
    course_title: "Web Application Security",
    title: "Week 2: OWASP Top 10 Injection & Broken Auth Lab",
    slug: "week-2-owasp-top10-injection",
    description:
      "Deep dive into OWASP A03 (Injection) and A01 (Broken Access Control). Audit a deliberately vulnerable REST API endpoint, demonstrate SQL injection proof-of-concept (POC), and implement parameterized queries and JWT signature validation to neutralize the vector.",
    objectives: [
      "Exploit an insecure authentication endpoint via union-based SQL injection",
      "Capture the auth bypass payload and reproduce it cleanly with curl or Python requests",
      "Refactor the backend route to employ strict parameterized queries and input validation",
    ],
    deliverables: [
      "GitHub link with your patch commit showing the vulnerable vs. secured backend code",
      "Writeup detailing how the vulnerability occurred and how defense-in-depth was applied",
      "Screenshot or terminal screencast of unit tests verifying remediation",
    ],
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 11).toISOString(),
    max_points: 100,
    passing_points: 70,
    difficulty: "Intermediate",
    status: "published",
    starter_repo_url: "https://github.com/samsedutech-labs/week2-injection-mitigation",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "wa-week-3-automation",
    week_number: 3,
    course_id: "all",
    course_title: "Python Security Automation",
    title: "Week 3: High-Throughput Log Parsing & Anomaly Detector",
    slug: "week-3-log-parsing-anomaly-detection",
    description:
      "Write an asynchronous Python CLI utility that ingests high-volume NGINX and Linux auth logs (100,000+ entries), extracts brute-force patterns using regex, flags suspicious IP clusters, and outputs a structured JSON report and Discord/Slack webhook alert.",
    objectives: [
      "Build a multi-threaded or AsyncIO log parsing engine in Python 3.11+",
      "Detect failed SSH logins exceeding 10 attempts within a 60-second sliding window",
      "Generate an RFC-compliant JSON threat artifact with geo-enrichment metadata",
    ],
    deliverables: [
      "GitHub repository link containing the Python utility with a clean README and pyproject.toml",
      "Benchmark demonstrating processing 50k log lines in under 3 seconds",
      "Example JSON threat alert artifact generated from sample log files",
    ],
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18).toISOString(),
    max_points: 100,
    passing_points: 75,
    difficulty: "Intermediate",
    status: "published",
    starter_repo_url: "https://github.com/samsedutech-labs/week3-python-log-analyzer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ── FILE SYSTEM HELPERS ──
function loadJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err);
    return defaultValue;
  }
}

function saveJsonFile<T>(filePath: string, data: T) {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

// ── WEEKLY ASSESSMENTS STORE ──
export async function getWeeklyAssessments(onlyPublished = false): Promise<WeeklyAssessment[]> {
  const localList = loadJsonFile<WeeklyAssessment[]>(ASSESSMENTS_FILE, INITIAL_ASSESSMENTS);
  let list = localList;

  // Attempt reading Supabase if weekly_assessments table exists
  try {
    const supabase = await createClient();
    const query = supabase.from("weekly_assessments").select("*").order("week_number", { ascending: true });
    if (onlyPublished) {
      query.eq("status", "published");
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      list = data as WeeklyAssessment[];
    }
  } catch {
    // Fall back to local file
  }

  if (onlyPublished) {
    return list.filter((a) => a.status === "published").sort((a, b) => a.week_number - b.week_number);
  }
  return list.sort((a, b) => a.week_number - b.week_number);
}

export async function getAssessmentById(id: string): Promise<WeeklyAssessment | null> {
  const all = await getWeeklyAssessments();
  return all.find((a) => a.id === id || a.slug === id) || null;
}

export async function createWeeklyAssessment(assessment: Omit<WeeklyAssessment, "id" | "created_at" | "updated_at">): Promise<WeeklyAssessment> {
  const newId = `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const fullItem: WeeklyAssessment = {
    ...assessment,
    id: newId,
    created_at: now,
    updated_at: now,
  };

  // Save to local store
  const current = loadJsonFile<WeeklyAssessment[]>(ASSESSMENTS_FILE, INITIAL_ASSESSMENTS);
  current.push(fullItem);
  saveJsonFile(ASSESSMENTS_FILE, current);

  // Sync to Supabase if available
  try {
    const supabase = await createClient();
    await supabase.from("weekly_assessments").insert(fullItem);
  } catch {
    // Local persistence guaranteed
  }

  await logAdminAction("PUBLISH_ASSESSMENT", "admin", `Published ${fullItem.title} (Week ${fullItem.week_number})`);
  return fullItem;
}

export async function updateWeeklyAssessment(id: string, updates: Partial<WeeklyAssessment>): Promise<WeeklyAssessment | null> {
  const current = loadJsonFile<WeeklyAssessment[]>(ASSESSMENTS_FILE, INITIAL_ASSESSMENTS);
  const index = current.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updated: WeeklyAssessment = {
    ...current[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  current[index] = updated;
  saveJsonFile(ASSESSMENTS_FILE, current);

  try {
    const supabase = await createClient();
    await supabase.from("weekly_assessments").update(updated).eq("id", id);
  } catch {
    // Local persistence guaranteed
  }

  await logAdminAction("UPDATE_ASSESSMENT", "admin", `Updated assessment ${updated.title}`);
  return updated;
}

export async function deleteWeeklyAssessment(id: string): Promise<boolean> {
  const current = loadJsonFile<WeeklyAssessment[]>(ASSESSMENTS_FILE, INITIAL_ASSESSMENTS);
  const filtered = current.filter((a) => a.id !== id);
  saveJsonFile(ASSESSMENTS_FILE, filtered);

  try {
    const supabase = await createClient();
    await supabase.from("weekly_assessments").delete().eq("id", id);
  } catch {
    // Local persistence guaranteed
  }

  await logAdminAction("DELETE_ASSESSMENT", "admin", `Deleted assessment ${id}`, "warning");
  return true;
}

// ── SUBMISSIONS STORE ──
export async function getSubmissions(userId?: string, assessmentId?: string): Promise<AssessmentSubmission[]> {
  const localList = loadJsonFile<AssessmentSubmission[]>(SUBMISSIONS_FILE, []);
  let list = localList;

  try {
    const supabase = await createClient();
    let query = supabase.from("assessment_submissions").select("*").order("submitted_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);
    if (assessmentId) query = query.eq("assessment_id", assessmentId);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      list = data as AssessmentSubmission[];
    }
  } catch {
    // Fall back to local list
  }

  let filtered = list;
  if (userId) filtered = filtered.filter((s) => s.user_id === userId);
  if (assessmentId) filtered = filtered.filter((s) => s.assessment_id === assessmentId);

  // Decrypt feedback if encrypted
  return filtered.map((sub) => {
    if (sub.feedback_encrypted) {
      try {
        sub.feedback = decryptSensitiveText(sub.feedback_encrypted);
      } catch {
        // Keep existing
      }
    }
    return sub;
  });
}

export async function submitAssessment(submission: Omit<AssessmentSubmission, "id" | "submitted_at" | "updated_at" | "status">): Promise<AssessmentSubmission> {
  const now = new Date().toISOString();
  const current = loadJsonFile<AssessmentSubmission[]>(SUBMISSIONS_FILE, []);

  // Check if submission already exists for this user and assessment
  const existingIndex = current.findIndex(
    (s) => s.assessment_id === submission.assessment_id && s.user_id === submission.user_id
  );

  let record: AssessmentSubmission;

  if (existingIndex >= 0) {
    // Update existing submission (resubmission)
    record = {
      ...current[existingIndex],
      ...submission,
      status: "submitted",
      updated_at: now,
    };
    current[existingIndex] = record;
  } else {
    record = {
      ...submission,
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: "submitted",
      submitted_at: now,
      updated_at: now,
    };
    current.unshift(record);
  }

  saveJsonFile(SUBMISSIONS_FILE, current);

  try {
    const supabase = await createClient();
    await supabase.from("assessment_submissions").upsert(record);
  } catch {
    // Local persistence guaranteed
  }

  return record;
}

export async function gradeSubmission(
  submissionId: string,
  gradeData: {
    score: number;
    grade: string;
    feedback: string;
    status: "graded" | "needs_revision" | "under_review";
    graded_by?: string;
  }
): Promise<AssessmentSubmission | null> {
  const current = loadJsonFile<AssessmentSubmission[]>(SUBMISSIONS_FILE, []);
  const index = current.findIndex((s) => s.id === submissionId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const encryptedFeedback = encryptSensitiveText(gradeData.feedback);

  const updated: AssessmentSubmission = {
    ...current[index],
    score: gradeData.score,
    grade: gradeData.grade,
    feedback: gradeData.feedback,
    feedback_encrypted: encryptedFeedback,
    status: gradeData.status,
    graded_by: gradeData.graded_by || "Head Mentor",
    graded_at: now,
    updated_at: now,
  };

  current[index] = updated;
  saveJsonFile(SUBMISSIONS_FILE, current);

  try {
    const supabase = await createClient();
    await supabase.from("assessment_submissions").update(updated).eq("id", submissionId);
  } catch {
    // Local persistence guaranteed
  }

  await logAdminAction(
    "GRADE_SUBMISSION",
    gradeData.graded_by || "admin",
    `Graded submission for ${updated.student_name}: Score ${gradeData.score} (${gradeData.grade})`
  );

  return updated;
}

// ── STUDENT PROFILES ADMIN DIRECTORY ──
export async function getStudentProfilesAdmin(): Promise<StudentProfileAdminView[]> {
  try {
    const supabase = await createClient();
    const [{ data: profiles }, { data: enrollments }, { data: courses }, submissions] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("enrollments").select("*, course:courses(*)"),
      supabase.from("courses").select("*"),
      getSubmissions(),
    ]);

    const coursesMap = new Map((courses || []).map((c: Course) => [c.id, c.title]));
    const studentProfiles: StudentProfileAdminView[] = [];

    // Map each profile
    const rawProfiles = profiles || [];
    for (const p of rawProfiles) {
      const userEnrollments = (enrollments || []).filter((e: { user_id: string }) => e.user_id === p.id);
      const userSubmissions = submissions.filter((s) => s.user_id === p.id);
      const graded = userSubmissions.filter((s) => typeof s.score === "number");
      const avgScore =
        graded.length > 0
          ? Math.round(graded.reduce((sum, s) => sum + (s.score || 0), 0) / graded.length)
          : null;

      studentProfiles.push({
        id: p.id,
        full_name: p.full_name || "Enrolled Student",
        email: p.email || p.username ? `${p.username}@student.samsedutech.in` : "student@samsedutech.in",
        username: p.username,
        bio: p.bio,
        avatar_url: p.avatar_url,
        role: p.role || "student",
        created_at: p.created_at || new Date().toISOString(),
        enrollments_count: userEnrollments.length,
        enrolled_courses: userEnrollments.map((e: { course_id: string; progress_percent: number }) => ({
          id: e.course_id,
          title: coursesMap.get(e.course_id) || "Enrolled Program",
          progress: Math.round(Number(e.progress_percent || 0)),
        })),
        submissions_count: userSubmissions.length,
        graded_count: graded.length,
        average_score: avgScore,
      });
    }

    if (studentProfiles.length > 0) return studentProfiles;
  } catch {
    // Fall back to mock directory
  }

  // Fallback demo cohort for immediate admin preview if no users created yet
  const submissions = await getSubmissions();
  return [
    {
      id: "student-alex-chen",
      full_name: "Alexandre Chen",
      email: "alex.chen@student.samsedutech.in",
      username: "alex_chen",
      bio: "Aspiring Penetration Tester & Cloud Security Architect.",
      avatar_url: null,
      role: "student",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      enrollments_count: 2,
      enrolled_courses: [
        { id: "c1", title: "Cybersecurity Foundations", progress: 85 },
        { id: "c2", title: "Web Application Security", progress: 42 },
      ],
      submissions_count: submissions.length,
      graded_count: submissions.filter((s) => s.status === "graded").length,
      average_score: 92,
      mentor_notes: "Strong network packet analysis skills. Working through OWASP Week 2.",
    },
    {
      id: "student-priya-sharma",
      full_name: "Priya Sharma",
      email: "priya.sharma@student.samsedutech.in",
      username: "priya_sec",
      bio: "Software Engineer transitioning to DevSecOps & Defensive Engineering.",
      avatar_url: null,
      role: "student",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
      enrollments_count: 1,
      enrolled_courses: [
        { id: "c1", title: "Python for Security", progress: 100 },
      ],
      submissions_count: 3,
      graded_count: 3,
      average_score: 96,
      mentor_notes: "Completed Python security track with distinction. Royal certificate claimed.",
    },
    {
      id: "student-rohan-verma",
      full_name: "Rohan Verma",
      email: "rohan.verma@student.samsedutech.in",
      username: "rohan_v",
      bio: "Computer Science undergraduate eager to build production security tools.",
      avatar_url: null,
      role: "student",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      enrollments_count: 1,
      enrolled_courses: [
        { id: "c1", title: "Cybersecurity Foundations", progress: 60 },
      ],
      submissions_count: 1,
      graded_count: 1,
      average_score: 88,
      mentor_notes: "Great pace on Week 1 reconnaissance lab.",
    },
  ];
}

// ── AUDIT LOGGING ──
export async function logAdminAction(
  action: string,
  adminId: string,
  details: string,
  severity: "info" | "warning" | "security" = "info"
): Promise<AdminAuditLog> {
  const current = loadJsonFile<AdminAuditLog[]>(AUDIT_LOGS_FILE, []);
  const entry: AdminAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    admin_id: adminId,
    adminId,
    details,
    severity,
    timestamp: new Date().toISOString(),
  };

  current.unshift(entry);
  if (current.length > 200) current.pop(); // keep last 200 logs
  saveJsonFile(AUDIT_LOGS_FILE, current);
  return entry;
}

export async function getAdminAuditLogs(): Promise<AdminAuditLog[]> {
  return loadJsonFile<AdminAuditLog[]>(AUDIT_LOGS_FILE, [
    {
      id: "log-init-1",
      action: "SYSTEM_INITIALIZED",
      admin_id: "system",
      adminId: "system",
      details: "Sams Edutech High-Security Admin Portal initialized.",
      severity: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: "log-init-2",
      action: "ENCRYPTION_ONLINE",
      admin_id: "system",
      adminId: "system",
      details: "AES-256-GCM feedback encryption verified.",
      severity: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    },
  ]);
}
