import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  createAuthCookieValue,
  getAuthPassword,
} from "@/lib/auth";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

type LoginAttemptRecord = {
  count: number;
  resetAt: number;
};

const loginAttempts = new Map<string, LoginAttemptRecord>();

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function getLoginAttemptRecord(clientKey: string) {
  const now = Date.now();
  const existingRecord = loginAttempts.get(clientKey);

  if (!existingRecord || existingRecord.resetAt <= now) {
    const nextRecord = {
      count: 0,
      resetAt: now + LOGIN_WINDOW_MS,
    };
    loginAttempts.set(clientKey, nextRecord);
    return nextRecord;
  }

  return existingRecord;
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = getClientKey(request);
    const attemptRecord = getLoginAttemptRecord(clientKey);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((attemptRecord.resetAt - Date.now()) / 1000),
    );

    if (attemptRecord.count >= MAX_LOGIN_ATTEMPTS) {
      return NextResponse.json(
        {
          error: `ลองเข้าสู่ระบบเกินกำหนด กรุณาลองใหม่อีกครั้งใน ${retryAfterSeconds} วินาที`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
          },
        },
      );
    }

    const body = await request.json();
    const password = `${body?.password || ""}`;

    if (password !== getAuthPassword()) {
      attemptRecord.count += 1;
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    loginAttempts.delete(clientKey);

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, createAuthCookieValue(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถเข้าสู่ระบบได้" },
      { status: 500 },
    );
  }
}
