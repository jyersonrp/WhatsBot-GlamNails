import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production" && fallback === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? fallback ?? "";
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  appSecret: process.env.APP_SECRET || "glam_nails_default_session_secret_dev_12345",
  databaseUrl: required("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/whatsbot_glamnails"),
  whatsappMode: (process.env.WHATSAPP_MODE || "mock") as "mock" | "meta",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "glamnails_webhook_verify_token_2026",
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
};
