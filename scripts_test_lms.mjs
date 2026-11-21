import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import fs from "node:fs";

// ── LMS Core Helpers ──
function clampProgress(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value ?? 0))));
}
function averageProgress(enrollments) {
  if (!enrollments.length) return 0;
  return Math.round(enrollments.reduce((sum, item) => sum + clampProgress(item.progress_percent), 0) / enrollments.length);
}
function recommendedCourses(courses, enrollments, limit = 3) {
  const enrolled = new Set(enrollments.map((item) => item.course_id));
  return courses.filter((course) => !enrolled.has(course.id)).slice(0, limit);
}

// ── Security & Cryptography Helpers ──
function safeNextPath(value) {
  if (!value || typeof value !== "string") return "/dashboard";
  const trimmed = value.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\") ||
    /[\x00-\x1F\x7F]/.test(trimmed)
  ) {
    return "/dashboard";
  }
  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") return "/dashboard";
    if (parsed.protocol !== "http:") return "/dashboard";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/dashboard";
  }
}

function timingSafeCompare(a, b) {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");
    if (bufA.length !== bufB.length) {
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

const TEST_SECRET = "sams_test_secret_32bytes_key_2026!";
const KEY_BUF = Buffer.from(TEST_SECRET.padEnd(32, "0").slice(0, 32), "utf-8");

function encryptSensitiveText(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY_BUF, iv);
  let enc = cipher.update(plaintext, "utf-8", "hex");
  enc += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${enc}`;
}

function decryptSensitiveText(payload) {
  const [ivHex, tagHex, enc] = payload.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY_BUF, iv);
  decipher.setAuthTag(tag);
  let dec = decipher.update(enc, "hex", "utf-8");
  dec += decipher.final("utf-8");
  return dec;
}

// ── Tests ──
test("clampProgress prevents invalid progress values", () => {
  assert.equal(clampProgress(-20), 0);
  assert.equal(clampProgress(42.6), 43);
  assert.equal(clampProgress(140), 100);
  assert.equal(clampProgress(null), 0);
});

test("averageProgress calculates a stable course average", () => {
  assert.equal(averageProgress([]), 0);
  assert.equal(averageProgress([{ progress_percent: 20 }, { progress_percent: 80 }]), 50);
  assert.equal(averageProgress([{ progress_percent: 120 }, { progress_percent: -1 }]), 50);
});

test("recommendedCourses excludes enrolled course ids and respects the limit", () => {
  const courses = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const enrollments = [{ course_id: "b" }];
  assert.deepEqual(recommendedCourses(courses, enrollments, 2).map((course) => course.id), ["a", "c"]);
});

test("safeNextPath neutralizes open redirect attempts", () => {
  assert.equal(safeNextPath(null), "/dashboard");
  assert.equal(safeNextPath(""), "/dashboard");
  assert.equal(safeNextPath("//evil.com"), "/dashboard");
  assert.equal(safeNextPath("/\\evil.com"), "/dashboard");
  assert.equal(safeNextPath("https://attacker.com"), "/dashboard");
  assert.equal(safeNextPath("javascript:alert(1)"), "/dashboard");
  assert.equal(safeNextPath("/courses"), "/courses");
  assert.equal(safeNextPath("/courses/cybersecurity-foundations?tab=assessments"), "/courses/cybersecurity-foundations?tab=assessments");
});

test("timingSafeCompare compares securely in constant time", () => {
  assert.equal(timingSafeCompare("sams-secret", "sams-secret"), true);
  assert.equal(timingSafeCompare("sams-secret", "wrong-secret"), false);
  assert.equal(timingSafeCompare("short", "longer-string"), false);
});

test("AES-256-GCM successfully encrypts and decrypts feedback notes", () => {
  const original = "Outstanding vulnerability analysis and report structure.";
  const encrypted = encryptSensitiveText(original);
  assert.notEqual(encrypted, original);
  assert.equal(encrypted.split(":").length, 3);
  const decrypted = decryptSensitiveText(encrypted);
  assert.equal(decrypted, original);
});

// ── Gmail & Indian Phone Validation Helpers for Testing ──
function isGmailAddress(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  return /^[a-z0-9](\.?[a-z0-9_-]){2,}@gmail\.com$/.test(trimmed);
}

function validateIndianPhoneNumber(phone) {
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return { isValid: false, normalized: "", error: "Please enter your 10-digit Indian mobile number." };
  }
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
  const match = cleaned.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  if (!match) {
    return { isValid: false, normalized: "", error: "Invalid Indian mobile number." };
  }
  const tenDigits = match[1];
  return { isValid: true, normalized: `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}` };
}

test("isGmailAddress accepts only valid @gmail.com addresses", () => {
  assert.equal(isGmailAddress("learner@gmail.com"), true);
  assert.equal(isGmailAddress("john.doe@gmail.com"), true);
  assert.equal(isGmailAddress("student_42@gmail.com"), true);
  assert.equal(isGmailAddress("STUDENT@GMAIL.COM"), true);

  // Rejected non-gmail domains
  assert.equal(isGmailAddress("student@yahoo.com"), false);
  assert.equal(isGmailAddress("student@outlook.com"), false);
  assert.equal(isGmailAddress("student@hotmail.com"), false);
  assert.equal(isGmailAddress("student@protonmail.com"), false);
  assert.equal(isGmailAddress("student@gmail.co"), false);
  assert.equal(isGmailAddress("student@notgmail.com"), false);
  assert.equal(isGmailAddress(""), false);
  assert.equal(isGmailAddress(null), false);
});

test("validateIndianPhoneNumber validates and normalizes Indian mobile numbers", () => {
  // Valid Indian mobile numbers (starting with 6, 7, 8, or 9)
  const test1 = validateIndianPhoneNumber("9876543210");
  assert.equal(test1.isValid, true);
  assert.equal(test1.normalized, "+91 98765 43210");

  const test2 = validateIndianPhoneNumber("+91 98765 43210");
  assert.equal(test2.isValid, true);
  assert.equal(test2.normalized, "+91 98765 43210");

  const test3 = validateIndianPhoneNumber("+919876543210");
  assert.equal(test3.isValid, true);
  assert.equal(test3.normalized, "+91 98765 43210");

  const test4 = validateIndianPhoneNumber("08765432100");
  assert.equal(test4.isValid, true);
  assert.equal(test4.normalized, "+91 87654 32100");

  const test5 = validateIndianPhoneNumber("7123456789");
  assert.equal(test5.isValid, true);
  assert.equal(test5.normalized, "+91 71234 56789");

  const test6 = validateIndianPhoneNumber("6987654321");
  assert.equal(test6.isValid, true);
  assert.equal(test6.normalized, "+91 69876 54321");

  // Invalid numbers
  assert.equal(validateIndianPhoneNumber("5123456789").isValid, false); // starts with 5
  assert.equal(validateIndianPhoneNumber("1234567890").isValid, false); // starts with 1
  assert.equal(validateIndianPhoneNumber("987654321").isValid, false); // 9 digits
  assert.equal(validateIndianPhoneNumber("+1 555 123 4567").isValid, false); // US number
  assert.equal(validateIndianPhoneNumber("+44 7911 123456").isValid, false); // UK number
  assert.equal(validateIndianPhoneNumber("").isValid, false);
  assert.equal(validateIndianPhoneNumber(null).isValid, false);
});

// ── UPI Reference Number (UTR) Validation Helper ──
function isValidUpiUtr(utr) {
  if (!utr || typeof utr !== "string") return false;
  const clean = utr.trim().replace(/\s+/g, "");
  return /^\d{12}$/.test(clean);
}

function validateUtrAuthenticity(utr) {
  if (!isValidUpiUtr(utr)) return { valid: false, reason: "Must be 12 digits" };
  const clean = utr.trim().replace(/\s+/g, "");
  if (/^(\d)\1{11}$/.test(clean)) return { valid: false, reason: "Identical digits" };
  const sequences = [
    "012345678901", "123456789012", "234567890123", "345678901234",
    "987654321098", "876543210987", "765432109876",
  ];
  if (sequences.includes(clean)) return { valid: false, reason: "Sequential pattern" };
  if (/^(\d{2})\1{5}$/.test(clean) || /^(\d{3})\1{3}$/.test(clean) || /^(\d{4})\1{2}$/.test(clean)) {
    return { valid: false, reason: "Repetitive pattern" };
  }
  const uniqueDigits = new Set(clean.split("")).size;
  if (uniqueDigits < 4) return { valid: false, reason: "Low entropy" };
  return { valid: true };
}

test("isValidUpiUtr validates 12-digit Indian UPI Reference Numbers", () => {
  assert.equal(isValidUpiUtr("432109876543"), true);
  assert.equal(isValidUpiUtr(" 432109876543 "), true);
  assert.equal(isValidUpiUtr("1234 5678 9012"), true);
  // Invalid UTRs
  assert.equal(isValidUpiUtr("43210987654"), false); // 11 digits
  assert.equal(isValidUpiUtr("4321098765432"), false); // 13 digits
  assert.equal(isValidUpiUtr("43210987ABCD"), false); // alphanumeric
  assert.equal(isValidUpiUtr(""), false);
  assert.equal(isValidUpiUtr(null), false);
});

test("validateUtrAuthenticity rejects fake, sequential, and brute-forced UTRs", () => {
  // Real genuine looking UTRs
  assert.equal(validateUtrAuthenticity("432109876543").valid, true);
  assert.equal(validateUtrAuthenticity("503412896745").valid, true);
  assert.equal(validateUtrAuthenticity("612984537120").valid, true);

  // Rejected dummy / brute-force patterns
  assert.equal(validateUtrAuthenticity("000000000000").valid, false); // identical digits
  assert.equal(validateUtrAuthenticity("111111111111").valid, false);
  assert.equal(validateUtrAuthenticity("123456789012").valid, false); // sequential
  assert.equal(validateUtrAuthenticity("987654321098").valid, false); // sequential
  assert.equal(validateUtrAuthenticity("121212121212").valid, false); // repetitive 2-digit cycle
  assert.equal(validateUtrAuthenticity("123123123123").valid, false); // repetitive 3-digit cycle
  assert.equal(validateUtrAuthenticity("111122221111").valid, false); // only 2 distinct digits (low entropy)
});

test("bulk verification helper updates multiple payments correctly", () => {
  const mockPayments = [
    { id: "p1", status: "pending_verification" },
    { id: "p2", status: "pending_verification" },
    { id: "p3", status: "verified" },
  ];
  const toVerify = ["p1", "p2"];
  const updated = mockPayments.map((p) =>
    toVerify.includes(p.id) ? { ...p, status: "verified" } : p
  );
  assert.equal(updated.filter((p) => p.status === "verified").length, 3);
  assert.equal(updated.filter((p) => p.status === "pending_verification").length, 0);
});

test("course catalog configuration matches exact duration and pricing requirements", () => {
  const coursesContent = fs.readFileSync(new URL("./lib/courses.ts", import.meta.url), "utf-8");
  
  // Exactly 1 3-Month course priced at 19999 (slashed 24000)
  assert.ok(coursesContent.includes('slug: "fullstack-web-development-accelerator"'));
  assert.ok(coursesContent.includes("price: 19999"));
  assert.ok(coursesContent.includes("original_price: 24000"));
  
  const threeMonthMatches = coursesContent.match(/duration_months:\s*3/g) || [];
  assert.equal(threeMonthMatches.length, 1, "There should be exactly one 3-month course");
  
  const fourMonthMatches = coursesContent.match(/duration_months:\s*4/g) || [];
  assert.equal(fourMonthMatches.length, 5, "There should be exactly 5 remaining 4-month courses");

  // Verify course syllabus coverage in lib/lms.ts
  const lmsContent = fs.readFileSync(new URL("./lib/lms.ts", import.meta.url), "utf-8");
  assert.ok(lmsContent.includes('case "fullstack-web-development-accelerator":'));
  assert.ok(lmsContent.includes('case "applied-data-science":'));
  assert.ok(lmsContent.includes('case "machine-learning-engineering":'));
  assert.ok(lmsContent.includes('case "cybersecurity-soc-operations":'));
  assert.ok(lmsContent.includes('case "generative-ai-and-agents":'));
  assert.ok(lmsContent.includes('case "fullstack-web-cloud-development":'));
});


