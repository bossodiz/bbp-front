// Server-side only — do not import in client components

import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// LOG LEVELS & TYPES
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  context?: Record<string, unknown>;
  statusCode?: number;
  duration?: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, module, message, context, statusCode, duration } =
      entry;
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    const statusStr = statusCode ? ` | Status: ${statusCode}` : "";
    const durationStr = duration ? ` | ${duration}ms` : "";

    return `[${timestamp}] ${level.toUpperCase()} [${module}]: ${message}${contextStr}${statusStr}${durationStr}`;
  }

  private log(entry: LogEntry): void {
    const formatted = this.formatLog(entry);

    // Color output in development only
    if (this.isDevelopment) {
      const colorCodes: Record<LogLevel, string> = {
        debug: "\x1b[36m", // cyan
        info: "\x1b[32m", // green
        warn: "\x1b[33m", // yellow
        error: "\x1b[31m", // red
        fatal: "\x1b[35m", // magenta
      };
      const reset = "\x1b[0m";
      const colored = `${colorCodes[entry.level]}${formatted}${reset}`;

      if (entry.level === "error" || entry.level === "fatal") {
        console.error(colored);
      } else if (entry.level === "warn") {
        console.warn(colored);
      } else if (entry.level === "debug") {
        console.debug(colored);
      } else {
        console.log(colored);
      }
    } else {
      if (entry.level === "error" || entry.level === "fatal") {
        console.error(formatted);
      } else if (entry.level === "warn") {
        console.warn(formatted);
      } else if (entry.level === "debug") {
        console.debug(formatted);
      } else {
        console.log(formatted);
      }
    }

    // Buffer last 100 entries for analysis
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }
  }

  debug(module: string, message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "debug",
      module,
      message,
      context,
    });
  }

  info(module: string, message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      module,
      message,
      context,
    });
  }

  warn(module: string, message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      module,
      message,
      context,
    });
  }

  error(module: string, message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "error",
      module,
      message,
      context,
    });
  }

  fatal(module: string, message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "fatal",
      module,
      message,
      context,
    });
  }

  // ========== API REQUEST/RESPONSE LOGGING ==========

  logApiRequest(
    module: string,
    method: string,
    path: string,
    ip?: string,
    context?: Record<string, unknown>,
  ): void {
    this.info(module, `${method} ${path}`, {
      type: "api_request",
      method,
      path,
      ip,
      ...context,
    });
  }

  logApiResponse(
    module: string,
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: Record<string, unknown>,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: statusCode >= 400 ? "warn" : "info",
      module,
      message: `${method} ${path} - ${statusCode}`,
      statusCode,
      duration,
      context: {
        type: "api_response",
        method,
        path,
        ...context,
      },
    };
    this.log(entry);
  }

  logDatabaseQuery(
    module: string,
    operation: string,
    table: string,
    duration: number,
    rowsAffected?: number,
  ): void {
    this.debug(module, `DB ${operation} on ${table}`, {
      type: "db_query",
      operation,
      table,
      duration,
      rowsAffected,
    });
  }

  // ========== RETRIEVE LOGS ==========

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return this.logBuffer;
    return this.logBuffer.filter((entry) => entry.level === level);
  }

  clearLogs(): void {
    this.logBuffer = [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const _logger = new Logger();

/**
 * Backward-compatible facade used by error-handler.ts and other callers.
 * Signature: logger.error(name, context?) — maps to internal error(name, "", context)
 */
export const logger = {
  error: (name: string, context?: Record<string, unknown>) =>
    _logger.error(name, "", context ?? {}),
  warn: (name: string, context?: Record<string, unknown>) =>
    _logger.warn(name, "", context ?? {}),
  info: (name: string, context?: Record<string, unknown>) =>
    _logger.info(name, "", context ?? {}),
  debug: (name: string, context?: Record<string, unknown>) =>
    _logger.debug(name, "", context ?? {}),
  fatal: (name: string, context?: Record<string, unknown>) =>
    _logger.fatal(name, "", context ?? {}),

  // Advanced methods delegated directly
  logApiRequest: _logger.logApiRequest.bind(_logger),
  logApiResponse: _logger.logApiResponse.bind(_logger),
  logDatabaseQuery: _logger.logDatabaseQuery.bind(_logger),
  getRecentLogs: _logger.getRecentLogs.bind(_logger),
  getLogs: _logger.getLogs.bind(_logger),
  clearLogs: _logger.clearLogs.bind(_logger),
};

// ============================================================================
// API MIDDLEWARE LOGGER
// ============================================================================

/**
 * Wraps an API route handler, logging the request and response automatically.
 * Example usage: place in middleware.ts or individual route handlers.
 */
export async function logApiOperation(
  module: string,
  request: NextRequest,
  handler: () => Promise<NextResponse | Response>,
  ip?: string,
): Promise<NextResponse | Response> {
  const method = request.method;
  const path = new URL(request.url).pathname;
  const startTime = Date.now();

  _logger.logApiRequest(module, method, path, ip);

  try {
    const response = await handler();
    const duration = Date.now() - startTime;
    const statusCode = response.status;

    _logger.logApiResponse(module, method, path, statusCode, duration);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    _logger.error(module, `${method} ${path} - Error`, {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    throw error;
  }
}
