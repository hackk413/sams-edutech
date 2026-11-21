import fs from "node:fs";
import path from "node:path";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { logAdminAction, recordRealStudent } from "@/lib/assessments";
import type { UpiGatewayConfig, UpiPaymentRecord } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const UPI_CONFIG_FILE = path.join(DATA_DIR, "upi_config.json");
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadJsonFile<T>(filePath: string, fallback: T): T {
  ensureDataDir();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function saveJsonFile<T>(filePath: string, data: T) {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export const DEFAULT_UPI_CONFIG: UpiGatewayConfig = {
  upi_id: "samsedutech@okaxis",
  payee_name: "Sams Edutech",
  qr_image_url: "/upi-qr-default.svg",
  auto_enroll: false, // Security default: Manual or Webhook verification protects against fake UTR brute forcing
  instructions:
    "Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM, CRED). Pay the exact tuition amount, copy the 12-digit UTR/UPI Reference Number from your payment receipt, and paste it below. Course access unlocks upon bank credit verification.",
  active: true,
};

// ── ANTI-BRUTE-FORCE & HEURISTIC FRAUD PREVENTION SHIELDS ──

// Rate limiter: Max 3 UTR submissions per user per hour
const userSubmissionTimestamps = new Map<string, number[]>();
const MAX_SUBMISSIONS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window

function checkSubmissionRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = (userSubmissionTimestamps.get(userId) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_SUBMISSIONS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  userSubmissionTimestamps.set(userId, timestamps);
  return { allowed: true, remaining: MAX_SUBMISSIONS_PER_HOUR - timestamps.length };
}

/**
 * Validates UTR format and applies entropy heuristics to reject dummy, sequential, or brute-force patterns
 */
export function validateUtrAuthenticity(utr: string): { valid: boolean; reason?: string } {
  const clean = utr.trim().replace(/\s+/g, "");

  // 1. Must be exactly 12 numeric digits
  if (!/^\d{12}$/.test(clean)) {
    return {
      valid: false,
      reason: "Invalid UTR format. The UPI Reference Number must be exactly 12 numeric digits (e.g. 432109876543).",
    };
  }

  // 2. Reject all identical digits (e.g. 000000000000, 111111111111, 999999999999)
  if (/^(\d)\1{11}$/.test(clean)) {
    return {
      valid: false,
      reason: "Invalid UTR: Repeated identical digits are detected. Please enter the authentic 12-digit UTR from your bank receipt.",
    };
  }

  // 3. Reject obvious ascending or descending sequences
  const trivialSequences = [
    "012345678901",
    "123456789012",
    "234567890123",
    "345678901234",
    "987654321098",
    "876543210987",
    "765432109876",
  ];
  if (trivialSequences.includes(clean)) {
    return {
      valid: false,
      reason: "Invalid UTR: Sequential sample numbers cannot be verified. Please copy the reference number from your Google Pay/PhonePe/Paytm receipt.",
    };
  }

  // 4. Reject repetitive chunk cycles (e.g. 121212121212, 123123123123, 123412341234)
  if (/^(\d{2})\1{5}$/.test(clean) || /^(\d{3})\1{3}$/.test(clean) || /^(\d{4})\1{2}$/.test(clean)) {
    return {
      valid: false,
      reason: "Invalid UTR: Repetitive number pattern detected. Please enter the exact UTR from your banking receipt.",
    };
  }

  // 5. Entropy check: Real NPCI UTRs have at least 4 unique digits
  const uniqueDigits = new Set(clean.split("")).size;
  if (uniqueDigits < 4) {
    return {
      valid: false,
      reason: "Invalid UTR: Genuine bank reference numbers contain higher entropy. Please verify your receipt.",
    };
  }

  return { valid: true };
}

// ── IN-MEMORY CACHE FOR FREE-TIER SUPABASE TRAFFIC PROTECTION ──
// These caches prevent high-frequency database reads from exhausting Supabase free tier limits.
let cachedUpiConfig: { data: UpiGatewayConfig; lastFetched: number } | null = null;
const CONFIG_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes in-memory TTL

let cachedPayments: { data: UpiPaymentRecord[]; lastFetched: number } | null = null;
const PAYMENTS_CACHE_TTL_MS = 15 * 1000; // 15 seconds in-memory TTL

// ── UPI GATEWAY CONFIGURATION ──

export async function getUpiConfig(): Promise<UpiGatewayConfig> {
  const now = Date.now();
  // 1. Return in-memory cache if fresh (zero DB queries, zero file I/O)
  if (cachedUpiConfig && now - cachedUpiConfig.lastFetched < CONFIG_CACHE_TTL_MS) {
    return cachedUpiConfig.data;
  }

  // 2. Read from disk cache
  const localConfig = loadJsonFile<UpiGatewayConfig>(UPI_CONFIG_FILE, DEFAULT_UPI_CONFIG);

  // If local config exists and was updated recently, populate memory cache to shield Supabase
  if (localConfig.updated_at && cachedUpiConfig === null) {
    cachedUpiConfig = { data: localConfig, lastFetched: now };
  }

  // 3. Fallback to Supabase sync only on cache miss or TTL expiration
  try {
    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
      .from("upi_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const merged: UpiGatewayConfig = {
        upi_id: data.upi_id || localConfig.upi_id,
        payee_name: data.payee_name || localConfig.payee_name,
        qr_image_url: data.qr_image_url || localConfig.qr_image_url,
        auto_enroll: typeof data.auto_enroll === "boolean" ? data.auto_enroll : localConfig.auto_enroll,
        instructions: data.instructions || localConfig.instructions,
        active: typeof data.active === "boolean" ? data.active : localConfig.active,
        updated_at: data.updated_at,
      };
      saveJsonFile(UPI_CONFIG_FILE, merged);
      cachedUpiConfig = { data: merged, lastFetched: now };
      return merged;
    }
  } catch {
    // Return local cache on offline or unconfigured database
  }

  cachedUpiConfig = { data: localConfig, lastFetched: now };
  return localConfig;
}

export async function saveUpiConfig(updates: Partial<UpiGatewayConfig>): Promise<UpiGatewayConfig> {
  const current = await getUpiConfig();
  const updated: UpiGatewayConfig = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Immediate synchronous cache update: Zero lag for users
  cachedUpiConfig = { data: updated, lastFetched: Date.now() };
  saveJsonFile(UPI_CONFIG_FILE, updated);

  try {
    const adminSupabase = await createAdminClient();
    await adminSupabase.from("upi_settings").upsert({
      id: "primary",
      upi_id: updated.upi_id,
      payee_name: updated.payee_name,
      qr_image_url: updated.qr_image_url,
      auto_enroll: updated.auto_enroll,
      instructions: updated.instructions,
      active: updated.active,
      updated_at: updated.updated_at,
    });
  } catch (err) {
    console.warn("Could not sync upi_settings to Supabase:", err);
  }

  await logAdminAction(
    "UPDATE_UPI_CONFIG",
    "admin",
    `Updated UPI gateway: VPA ${updated.upi_id}, auto-enroll: ${updated.auto_enroll ? "ENABLED" : "DISABLED"}`
  );

  return updated;
}

// ── UPI PAYMENTS RETRIEVAL ──

export async function getUpiPayments(): Promise<UpiPaymentRecord[]> {
  const now = Date.now();
  // Return in-memory payments cache if fresh
  if (cachedPayments && now - cachedPayments.lastFetched < PAYMENTS_CACHE_TTL_MS) {
    return cachedPayments.data;
  }

  const localPayments = loadJsonFile<UpiPaymentRecord[]>(PAYMENTS_FILE, []);

  try {
    const adminSupabase = await createAdminClient();

    // 1. Try calling get_admin_payments_directory RPC (Security Definer)
    try {
      const { data: rpcData, error: rpcError } = await adminSupabase.rpc("get_admin_payments_directory");
      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        saveJsonFile(PAYMENTS_FILE, rpcData);
        cachedPayments = { data: rpcData as UpiPaymentRecord[], lastFetched: now };
        return rpcData as UpiPaymentRecord[];
      }
    } catch {
      // Fallback to table query
    }

    const { data, error } = await adminSupabase
      .from("upi_payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const mergedMap = new Map<string, UpiPaymentRecord>();
      // Put database records
      data.forEach((p) => {
        if (p.id) mergedMap.set(p.id, p as UpiPaymentRecord);
      });
      // Merge local records
      localPayments.forEach((p) => {
        if (p.id && !mergedMap.has(p.id)) {
          mergedMap.set(p.id, p);
        }
      });

      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      saveJsonFile(PAYMENTS_FILE, merged);
      cachedPayments = { data: merged, lastFetched: now };
      return merged;
    }
  } catch {
    // Return local payments cache
  }

  cachedPayments = { data: localPayments, lastFetched: now };
  return localPayments;
}

// ── SUBMIT UPI PAYMENT & ENROLLMENT ──

export async function submitUpiPayment(input: {
  user_id: string;
  student_name: string;
  student_email: string;
  student_phone?: string | null;
  course_id: string;
  course_title: string;
  amount: number;
  utr_number: string;
  sender_upi_id?: string | null;
  screenshot_url?: string | null;
}): Promise<{ success: boolean; error?: string; payment?: UpiPaymentRecord; enrollment_created?: boolean }> {
  const cleanUtr = input.utr_number.trim().replace(/\s+/g, "");

  // 1. Anti-Brute-Force Rate Limiting (Max 3 submissions per hour per user)
  const rateLimit = checkSubmissionRateLimit(input.user_id);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Rate limit exceeded: Maximum 3 payment submission attempts allowed per hour. Please contact faculty support if you need assistance.",
    };
  }

  // 2. Validate UTR Authenticity & Entropy (Prevents dummy/sequential/synthetic brute-forcing)
  const authCheck = validateUtrAuthenticity(cleanUtr);
  if (!authCheck.valid) {
    return {
      success: false,
      error: authCheck.reason || "Invalid UPI Reference Number (UTR).",
    };
  }

  // 3. Prevent Duplicate UTR submissions across the platform
  const existing = await getUpiPayments();
  const duplicate = existing.find((p) => p.utr_number === cleanUtr);
  if (duplicate) {
    if (duplicate.user_id === input.user_id && duplicate.course_id === input.course_id) {
      return {
        success: false,
        error: "You have already submitted this UTR for this course. Your access is active or under verification.",
      };
    }
    return {
      success: false,
      error: "This 12-digit UTR has already been registered in our system. Please check your banking transaction receipt.",
    };
  }

  // 4. Prevent Multiple Concurrent Pending Submissions for the Same Course
  const pendingSameCourse = existing.find(
    (p) => p.user_id === input.user_id && p.course_id === input.course_id && p.status === "pending_verification"
  );
  if (pendingSameCourse) {
    return {
      success: false,
      error: `You already have a pending verification for this course (UTR: ${pendingSameCourse.utr_number}). Please allow our team to confirm with bank records before submitting another number.`,
    };
  }

  const config = await getUpiConfig();
  const now = new Date().toISOString();
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const record: UpiPaymentRecord = {
    id: paymentId,
    user_id: input.user_id,
    student_name: input.student_name,
    student_email: input.student_email,
    student_phone: input.student_phone || null,
    course_id: input.course_id,
    course_title: input.course_title,
    amount: input.amount,
    utr_number: cleanUtr,
    sender_upi_id: input.sender_upi_id || null,
    screenshot_url: input.screenshot_url || null,
    status: config.auto_enroll ? "verified" : "pending_verification",
    admin_notes: config.auto_enroll ? "Auto-verified via instant 12-digit UTR submission" : null,
    verified_by: config.auto_enroll ? "System (Auto-Approve)" : null,
    verified_at: config.auto_enroll ? now : null,
    created_at: now,
    updated_at: now,
  };

  // 3. Save to local payments file and reset in-memory payments cache
  const updatedPayments = [record, ...existing];
  cachedPayments = { data: updatedPayments, lastFetched: Date.now() };
  saveJsonFile(PAYMENTS_FILE, updatedPayments);

  // 4. Save to Supabase `upi_payments` table
  try {
    const adminSupabase = await createAdminClient();
    await adminSupabase.from("upi_payments").upsert(record);
  } catch (err) {
    console.warn("Could not insert upi_payment to Supabase:", err);
  }

  // 5. If auto_enroll is enabled: Create course enrollment immediately
  let enrollmentCreated = false;
  if (config.auto_enroll) {
    try {
      const adminSupabase = await createAdminClient();
      await adminSupabase.from("enrollments").upsert({
        user_id: input.user_id,
        course_id: input.course_id,
        progress_percent: 0,
        enrolled_at: now,
      });
      enrollmentCreated = true;
    } catch (err) {
      console.warn("Could not create enrollment via admin client:", err);
      try {
        const clientSupabase = await createClient();
        await clientSupabase.from("enrollments").upsert({
          user_id: input.user_id,
          course_id: input.course_id,
          progress_percent: 0,
          enrolled_at: now,
        });
        enrollmentCreated = true;
      } catch (err2) {
        console.error("Enrollment fallback failed:", err2);
      }
    }
  }

  // 6. Record real student in directory
  recordRealStudent({
    id: input.user_id,
    full_name: input.student_name,
    email: input.student_email,
    phone_number: input.student_phone,
  });

  // 7. Audit log
  await logAdminAction(
    "NEW_UPI_PAYMENT",
    input.student_email,
    `New UPI Payment ₹${input.amount} for "${input.course_title}" with UTR ${cleanUtr}. Status: ${record.status}`
  );

  return {
    success: true,
    payment: record,
    enrollment_created: enrollmentCreated,
  };
}

// ── VERIFY OR REJECT UPI PAYMENT (Admin Operation) ──

export async function verifyUpiPayment(
  paymentId: string,
  action: "verify" | "reject",
  adminNotes?: string,
  adminId = "admin"
): Promise<{ success: boolean; error?: string; payment?: UpiPaymentRecord }> {
  const payments = await getUpiPayments();
  const index = payments.findIndex((p) => p.id === paymentId);

  if (index === -1) {
    return { success: false, error: "Payment record not found." };
  }

  const target = payments[index];
  const now = new Date().toISOString();

  const updated: UpiPaymentRecord = {
    ...target,
    status: action === "verify" ? "verified" : "rejected",
    admin_notes: adminNotes || (action === "verify" ? "Confirmed by admin" : "Payment rejected / UTR mismatch"),
    verified_by: adminId,
    verified_at: now,
    updated_at: now,
  };

  payments[index] = updated;
  cachedPayments = { data: payments, lastFetched: Date.now() };
  saveJsonFile(PAYMENTS_FILE, payments);

  try {
    const adminSupabase = await createAdminClient();
    await adminSupabase.from("upi_payments").update(updated).eq("id", paymentId);

    if (action === "verify") {
      // Ensure enrollment is active
      await adminSupabase.from("enrollments").upsert({
        user_id: target.user_id,
        course_id: target.course_id,
        progress_percent: 0,
        enrolled_at: now,
      });
    } else if (action === "reject") {
      // Revoke course enrollment if fake or rejected
      await adminSupabase
        .from("enrollments")
        .delete()
        .eq("user_id", target.user_id)
        .eq("course_id", target.course_id);
    }
  } catch (err) {
    console.warn("Could not sync verification to Supabase:", err);
  }

  await logAdminAction(
    action === "verify" ? "VERIFY_UPI_PAYMENT" : "REJECT_UPI_PAYMENT",
    adminId,
    `${action === "verify" ? "Verified" : "Rejected"} UPI Payment ${paymentId} (UTR: ${target.utr_number}) for ${target.student_name}`
  );

  return { success: true, payment: updated };
}
