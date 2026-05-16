/**
 * Validate that all required environment variables are set.
 * This runs when the app starts to catch configuration errors early.
 */

import { logger } from "@/lib/logger";

const REQUIRED_ENV_VARS = [
  "AUTH_PASSWORD",
  "AUTH_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
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
