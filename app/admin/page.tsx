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
import { getUpiPayments, getUpiConfig, DEFAULT_UPI_CONFIG } from "@/lib/payments";
import { AdminPanel } from "@/components/admin-panel";
import type {
  WeeklyAssessment,
  AssessmentSubmission,
  StudentProfileAdminView,
  AdminAuditLog,
  CoursePricingConfig,
  UpiPaymentRecord,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin Command Center — Sams Edutech",
  description: "Secure administrative management console for weekly assessments, submissions grading, student profiles, and course pricing.",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  const isAuthenticated = verifyAdminSessionToken(token);

  let assessments: WeeklyAssessment[] = [];
  let submissions: AssessmentSubmission[] = [];
  let students: StudentProfileAdminView[] = [];
  let auditLogs: AdminAuditLog[] = [];
  let pricing: Record<string, CoursePricingConfig> = {};
  let payments: UpiPaymentRecord[] = [];
  let upiConfig = DEFAULT_UPI_CONFIG;

  try {
    const results = await Promise.allSettled([
      getWeeklyAssessments(false),
      getSubmissions(),
      getStudentProfilesAdmin(),
      getAdminAuditLogs(),
      getDynamicCoursePricing(),
      getUpiPayments(),
      getUpiConfig(),
    ]);

    if (results[0].status === "fulfilled") assessments = results[0].value;
    if (results[1].status === "fulfilled") submissions = results[1].value;
    if (results[2].status === "fulfilled") students = results[2].value;
    if (results[3].status === "fulfilled") auditLogs = results[3].value;
    if (results[4].status === "fulfilled") pricing = results[4].value;
    if (results[5].status === "fulfilled") payments = results[5].value;
    if (results[6].status === "fulfilled") upiConfig = results[6].value;
  } catch (err) {
    console.error("Error loading admin datasets in AdminPage:", err);
  }

  return (
    <AdminPanel
      initialAuthenticated={isAuthenticated}
      initialAssessments={assessments}
      initialSubmissions={submissions}
      initialStudents={students}
      initialAuditLogs={auditLogs}
      initialPricing={pricing}
      initialPayments={payments}
      initialUpiConfig={upiConfig}
    />
  );
}
