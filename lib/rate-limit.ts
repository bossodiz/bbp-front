import { NextRequest } from "next/server";

// ============================================================================
// IN-MEMORY RATE LIMITER - เก็บข้อมูล rate limiting ใน memory
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// RATE LIMITER
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * ตรวจสอบ rate limiting สำหรับ IP address
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // ถ้ายังไม่เกิน time window ให้ increment count
  if (entry && entry.resetTime > now) {
    const isExceeded = entry.count >= config.maxRequests;

    if (!isExceeded) {
      entry.count++;
    }

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const retryAfter = isExceeded
      ? Math.ceil((entry.resetTime - now) / 1000)
      : undefined;

    return {
      success: !isExceeded,
      remaining,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // สร้าง entry ใหม่
  const resetTime = now + config.windowMs;
  rateLimitStore.set(identifier, {
    count: 1,
    resetTime,
  });

  return {
    success: true,
    remaining: config.maxRequests - 1,
    resetTime,
  };
}

// ============================================================================
// GET IP ADDRESS FROM REQUEST
// ============================================================================

/**
 * ดึง client IP address จาก request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() :
    request.headers.get("x-real-ip") ||
    "unknown";
  return ip;
}

// ============================================================================
// COMMON RATE LIMIT CONFIGS
// ============================================================================

export const rateLimitConfigs = {
  // login: 5 requests per 15 minutes
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },

  // Standard API: 60 requests per 1 minute
  standard: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },

  // Relaxed: 100 requests per 1 minute
  relaxed: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },

  // Strict: 10 requests per 1 minute
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
};
