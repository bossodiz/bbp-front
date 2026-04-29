import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "bbp_auth";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24;

const FALLBACK_AUTH_PASSWORD = "bbp1234";
const FALLBACK_AUTH_SECRET = "bbp-front-auth-secret";

export function getAuthPassword() {
  return process.env.AUTH_PASSWORD || FALLBACK_AUTH_PASSWORD;
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || FALLBACK_AUTH_SECRET;
}

function signAuthPayload(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

export function createAuthCookieValue() {
  const expiresAt = Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE;
  const payload = JSON.stringify({ exp: expiresAt });
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const signature = signAuthPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function isAuthenticatedCookie(value?: string) {
  if (!value) {
    return false;
  }

  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = signAuthPayload(encodedPayload);
  const providedSignature = Buffer.from(signature, "utf8");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedSignature.length !== expectedSignatureBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(providedSignature, expectedSignatureBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as { exp?: number };

    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
