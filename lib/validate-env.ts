/**
 * Validate that all required environment variables are set.
 * This runs when the app starts to catch configuration errors early.
 */

import { logger } from "@/lib/logger";

// AUTH_SECRET is still used by lib/auth.ts to validate the bbp_auth cookie for
// dashboard/login page-gating. All data + password auth now lives in the Java backend
// (proxied via /api/*), so Supabase and the shared password are no longer needed here.
const REQUIRED_ENV_VARS = [
  "AUTH_SECRET",
] as const;

export function validateEnv(): void {
  const missingVars: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    logger.error("validate_env", {
      message: "Missing required environment variables",
      missingVars,
    });
    process.exit(1);
  }

  logger.info("validate_env", { message: "All required environment variables are set." });
}
