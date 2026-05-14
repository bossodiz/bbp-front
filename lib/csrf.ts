import { createHmac, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { CsrfError } from "./error-handler";

const CSRF_SECRET = process.env.CSRF_SECRET || "csrf-secret-key";
const CSRF_TOKEN_HEADER = "x-csrf-token";
const CSRF_TOKEN_COOKIE = "csrf-token";

// ============================================================================
// GENERATE CSRF TOKEN - สร้าง token ใหม่
// ============================================================================

/**
 * สร้าง CSRF token ใหม่และ signature
 * Token = random bytes + HMAC signature
 */
export function generateCsrfToken(): { token: string; signature: string } {
  const randomPart = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", CSRF_SECRET)
    .update(randomPart)
    .digest("hex");

  const token = `${randomPart}.${signature}`;
  return { token, signature };
}

// ============================================================================
// VALIDATE CSRF TOKEN - ตรวจสอบ token
// ============================================================================

/**
 * ตรวจสอบ CSRF token ว่าถูกต้อง
 * ใช้ timing-safe comparison เพื่อป้องกัน timing attacks
 */
export function validateCsrfToken(token: string): boolean {
  try {
    const [randomPart, providedSignature] = token.split(".");

    if (!randomPart || !providedSignature) {
      return false;
    }

    const expectedSignature = createHmac("sha256", CSRF_SECRET)
      .update(randomPart)
      .digest("hex");

    return timingSafeEqual(providedSignature, expectedSignature);
  } catch {
    return false;
  }
}

// ============================================================================
// TIMING-SAFE COMPARISON - ป้องกัน timing attacks
// ============================================================================

/**
 * เปรียบเทียบ strings แบบ timing-safe
 * ใช้เวลาเท่ากันไม่ว่า strings จะเท่ากันหรือไม่
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// VALIDATE CSRF FROM REQUEST - ตรวจสอบ CSRF token จาก request headers
// ============================================================================

/**
 * ตรวจสอบ CSRF token จาก request headers
 * ต้องมี x-csrf-token header ที่มี token ที่ถูกต้อง
 */
export function validateCsrfFromRequest(request: NextRequest): void {
  const token = request.headers.get(CSRF_TOKEN_HEADER);

  if (!token || !validateCsrfToken(token)) {
    throw new CsrfError("Invalid or missing CSRF token");
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const csrfConfig = {
  tokenHeader: CSRF_TOKEN_HEADER,
  tokenCookie: CSRF_TOKEN_COOKIE,
};
