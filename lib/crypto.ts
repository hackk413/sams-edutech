import crypto from "node:crypto";

const DEFAULT_SECRET = "sams_edutech_master_auth_secret_32bytes_2026_prod!";
const MASTER_KEY = (process.env.ADMIN_SECRET_KEY || process.env.ADMIN_ACCESS_KEY || DEFAULT_SECRET)
  .padEnd(32, "0")
  .slice(0, 32);

const ADMIN_PASSKEY = process.env.ADMIN_ACCESS_KEY || "sams-edutech-admin-2026-secure-key";

/**
 * Timing-safe string comparison to protect against side-channel timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");
    if (bufA.length !== bufB.length) {
      // Execute dummy comparison to maintain constant time
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Validates the admin master access key securely
 */
export function verifyAdminPasskey(candidate: string): boolean {
  if (!candidate || typeof candidate !== "string") return false;
  return timingSafeCompare(candidate.trim(), ADMIN_PASSKEY.trim());
}

/**
 * Creates an HMAC-SHA256 signature for data
 */
export function createHmacSignature(data: string): string {
  return crypto.createHmac("sha256", MASTER_KEY).update(data).digest("hex");
}

/**
 * Encrypts sensitive text using AES-256-GCM with authentication tag
 */
export function encryptSensitiveText(plaintext: string): string {
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(MASTER_KEY, "utf-8"), iv);
    let encrypted = cipher.update(plaintext, "utf-8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption failed:", err);
    return plaintext;
  }
}

/**
 * Decrypts AES-256-GCM encrypted payload
 */
export function decryptSensitiveText(payload: string): string {
  try {
    if (!payload || !payload.includes(":")) return payload;
    const parts = payload.split(":");
    if (parts.length !== 3) return payload;
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(MASTER_KEY, "utf-8"), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  } catch {
    return payload;
  }
}

/**
 * Generates a signed, tamper-proof session token for the admin dashboard
 */
export function createAdminSessionToken(adminId = "admin_master"): string {
  const payload = {
    sub: adminId,
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours rolling session
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const jsonStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonStr).toString("base64url");
  const signature = createHmacSignature(base64Payload);
  return `${base64Payload}.${signature}`;
}

/**
 * Verifies the admin session token
 */
export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [base64Payload, signature] = token.split(".");
  if (!base64Payload || !signature) return false;

  const expectedSig = createHmacSignature(base64Payload);
  if (!timingSafeCompare(signature, expectedSig)) return false;

  try {
    const jsonStr = Buffer.from(base64Payload, "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr);
    if (!payload || typeof payload !== "object") return false;
    if (payload.role !== "admin") return false;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}
