/**
 * Validate that all required environment variables are set.
 * This runs when the app starts to catch configuration errors early.
 */

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
    console.error(
      "❌ Missing required environment variables:\n" +
        missingVars.map((v) => `   - ${v}`).join("\n") +
        "\n\nPlease set these variables in your .env.local file.",
    );
    process.exit(1);
  }

  console.log("✅ All required environment variables are set.");
}
