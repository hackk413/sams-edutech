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
  auto_enroll: true,
  instructions:
    "Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM, CRED). Pay the exact tuition amount, copy the 12-digit UTR/UPI Reference Number from your payment receipt, and paste it below to activate your course enrollment.",
  active: true,
};

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

  // 1. Validate UTR (Must be exactly 12 numeric digits)
  if (!/^\d{12}$/.test(cleanUtr)) {
    return {
      success: false,
      error: "Invalid UPI Reference Number (UTR). It must be exactly 12 digits (e.g. 432109876543).",
    };
  }

  // 2. Prevent Duplicate UTR submissions
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
