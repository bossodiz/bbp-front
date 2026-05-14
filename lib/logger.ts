/**
 * Structured logging utility for server-side logging
 * Logs are only visible in development and server logs
 * Console will be removed in production build (via next.config.mjs)
 */

interface LogContext {
  [key: string]: unknown;
}

type LogLevel = "error" | "warn" | "info" | "debug";

function formatLog(level: LogLevel, name: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? JSON.stringify(context) : "";

  if (level === "error") {
    console.error(
      `[${timestamp}] ERROR [${name}]: ${contextStr}`,
    );
  } else if (level === "warn") {
    console.warn(
      `[${timestamp}] WARN [${name}]: ${contextStr}`,
    );
  } else if (level === "info") {
    console.log(
      `[${timestamp}] INFO [${name}]: ${contextStr}`,
    );
  } else {
    console.debug(
      `[${timestamp}] DEBUG [${name}]: ${contextStr}`,
    );
  }
}

export const logger = {
  error: (name: string, context?: LogContext) => {
    formatLog("error", name, context);
  },

  warn: (name: string, context?: LogContext) => {
    formatLog("warn", name, context);
  },

  info: (name: string, context?: LogContext) => {
    formatLog("info", name, context);
  },

  debug: (name: string, context?: LogContext) => {
    formatLog("debug", name, context);
  },
};
