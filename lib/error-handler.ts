import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";

// ============================================================================
// ERROR TYPES - กำหนด error classes ให้ใช้ในทั่วแอปพลิเคชัน
// ============================================================================

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class CsrfError extends Error {
  constructor(message: string = "CSRF token validation failed") {
    super(message);
    this.name = "CsrfError";
  }
}

export class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
  }
}

// ============================================================================
// API ERROR RESPONSE FORMAT - รูปแบบ response ที่ consistent
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: unknown;
  timestamp: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

// ============================================================================
// ERROR HANDLER - ฟังก์ชันหลักจัดการ errors
// ============================================================================

interface ErrorHandlerResult {
  response: ApiErrorResponse;
  status: number;
}

/**
 * จัดการ errors จากทั้ง API routes
 * @param error - error object ที่เกิดขึ้น
 * @param context - ชื่อของ function/endpoint สำหรับ logging
 * @param defaultMessage - default message ถ้า error ไม่มี message
 * @returns { response: ApiErrorResponse, status: number }
 *
 * การใช้:
 * try {
 *   // ... code ...
 * } catch (error) {
 *   const { response, status } = handleApiError(error, "products_fetch");
 *   return NextResponse.json(response, { status });
 * }
 */
export function handleApiError(
  error: unknown,
  context: string,
  defaultMessage: string = "An error occurred",
): ErrorHandlerResult {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const timestamp = new Date().toISOString();

  // Log the error
  logger.error(context, {
    error: errorMessage,
    type: error instanceof Error ? error.name : typeof error,
  });

  // ========== ZOD VALIDATION ERROR (400) ==========
  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors)[0]?.[0];
    return {
      response: {
        error: firstError || "ข้อมูลไม่ถูกต้อง",
        code: "VALIDATION_ERROR",
        details: fieldErrors,
        timestamp,
      },
      status: 400,
    };
  }

  // ========== VALIDATION ERROR (400) ==========
  if (error instanceof ValidationError) {
    return {
      response: {
        error: error.message,
        code: "VALIDATION_ERROR",
        timestamp,
      },
      status: 400,
    };
  }

  // ========== AUTH ERROR (401) ==========
  if (error instanceof AuthError) {
    return {
      response: {
        error: error.message,
        code: "AUTH_ERROR",
        timestamp,
      },
      status: 401,
    };
  }

  // ========== FORBIDDEN ERROR (403) ==========
  if (error instanceof ForbiddenError) {
    return {
      response: {
        error: error.message,
        code: "FORBIDDEN",
        timestamp,
      },
      status: 403,
    };
  }

  // ========== CSRF ERROR (403) ==========
  if (error instanceof CsrfError) {
    return {
      response: {
        error: error.message,
        code: "CSRF_TOKEN_INVALID",
        timestamp,
      },
      status: 403,
    };
  }

  // ========== RATE LIMIT ERROR (429) ==========
  if (error instanceof RateLimitError) {
    return {
      response: {
        error: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
        details: {
          retryAfter: error.retryAfter,
        },
        timestamp,
      },
      status: 429,
    };
  }

  // ========== NOT FOUND ERROR (404) ==========
  if (error instanceof NotFoundError) {
    return {
      response: {
        error: error.message,
        code: "NOT_FOUND",
        timestamp,
      },
      status: 404,
    };
  }

  // ========== DATABASE ERROR (500) ==========
  if (error instanceof DatabaseError) {
    return {
      response: {
        error: "Database operation failed",
        code: "DATABASE_ERROR",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        timestamp,
      },
      status: 500,
    };
  }

  // ========== DEFAULT SERVER ERROR (500) ==========
  return {
    response: {
      error: defaultMessage,
      code: "SERVER_ERROR",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      timestamp,
    },
    status: 500,
  };
}

// ============================================================================
// NEXT.JS RESPONSE HELPER - ช่วย return responses
// ============================================================================

/**
 * Return success response
 * @param data - ข้อมูลที่ส่งกลับ
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiSuccessResponse<T>,
    { status },
  );
}

/**
 * Return error response
 * @param error - error object
 * @param context - function name for logging
 * @param defaultMessage - default error message
 */
export function errorResponse(
  error: unknown,
  context: string,
  defaultMessage: string = "An error occurred",
) {
  const { response, status } = handleApiError(error, context, defaultMessage);
  return NextResponse.json(response, { status });
}
