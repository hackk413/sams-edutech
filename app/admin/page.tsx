import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/lib/crypto";
import {
  getWeeklyAssessments,
  getSubmissions,
  getStudentProfilesAdmin,
  getAdminAuditLogs,
} from "@/lib/assessments";
import { getDynamicCoursePricing } from "@/lib/courses-server";
import { AdminPanel } from "@/components/admin-panel";

export const metadata: Metadata = {
  title: "Admin Command Center — Sams Edutech",
  description: "Secure administrative management console for weekly assessments, submissions grading, student profiles, and course pricing.",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  const isAuthenticated = verifyAdminSessionToken(token);

  const [assessments, submissions, students, auditLogs, pricing] = await Promise.all([
    getWeeklyAssessments(false),
    getSubmissions(),
    getStudentProfilesAdmin(),
    getAdminAuditLogs(),
    getDynamicCoursePricing(),
  ]);

  return (
    <AdminPanel
      initialAuthenticated={isAuthenticated}
      initialAssessments={assessments}
      initialSubmissions={submissions}
      initialStudents={students}
      initialAuditLogs={auditLogs}
      initialPricing={pricing}
    />
  );
}
