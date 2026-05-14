import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "bbp_auth";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24;

export function getAuthPassword() {
  const password = process.env.AUTH_PASSWORD;
  if (!password) {
    throw new Error(
      "AUTH_PASSWORD environment variable is required but not set. Please set it in your .env.local file.",
    );
  }
  return password;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET environment variable is required but not set. Please set it in your .env.local file.",
    );
  }
  return secret;
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

interface AuthPayload {
  exp?: number;
}

export function isAuthenticatedCookie(value?: string): boolean {
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
    ) as AuthPayload;

    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
