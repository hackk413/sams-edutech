export type SyllabusModule = {
  title: string;
  duration: string;
  topics: string[];
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  duration_hours: number;
  lessons_count: number;
  accent: "blue" | "orange" | "dark" | "green" | "purple";
  highlights: string[];
  price?: number;
  original_price?: number;
  syllabus?: SyllabusModule[];
};

export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url?: string | null;
  role?: "student" | "admin" | "mentor";
  email?: string | null;
  created_at: string;
  updated_at: string;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  last_activity_at: string | null;
  enrolled_at: string;
  course: Course;
};

export type WeeklyAssessment = {
  id: string;
  week_number: number;
  course_id: string; // Course ID or "all" for universal track
  course_title: string;
  title: string;
  slug: string;
  description: string;
  objectives: string[];
  deliverables: string[];
  due_date: string; // ISO 8601 string
  max_points: number;
  passing_points: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  status: "published" | "draft" | "closed";
  starter_repo_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentSubmission = {
  id: string;
  assessment_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  github_url: string;
  demo_url?: string | null;
  notes?: string | null;
  submission_content?: string | null;
  status: "submitted" | "under_review" | "graded" | "needs_revision";
  score?: number | null; // 0 to max_points
  grade?: string | null; // e.g. "A+", "A", "B", "Pass"
  feedback?: string | null;
  feedback_encrypted?: string | null;
  graded_by?: string | null;
  graded_at?: string | null;
  submitted_at: string;
  updated_at: string;
};

export type StudentProfileAdminView = {
  id: string;
  full_name: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  enrollments_count: number;
  enrolled_courses: { id: string; title: string; progress: number }[];
  submissions_count: number;
  graded_count: number;
  average_score: number | null;
  mentor_notes?: string | null;
};

export type AdminAuditLog = {
  id: string;
  action: string;
  admin_id: string;
  adminId?: string;
  details: string;
  timestamp: string;
  severity: "info" | "warning" | "security";
};
