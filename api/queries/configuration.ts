import { getDb } from "./connection";
import {
  botConfiguration,
  whatsappConfig,
  webhookLogs,
  type InsertBotConfiguration,
  type InsertWhatsappConfig,
} from "@db/schema";
import { eq, desc } from "drizzle-orm";

// ─── Bot Configuration ─────────────────────────────────────────────

export async function getBotConfiguration() {
  const db = getDb();
  const configs = await db.query.botConfiguration.findMany({ limit: 1 });
  if (configs.length === 0) {
    // Create default config
    const result = await db
      .insert(botConfiguration)
      .values({
        welcomeMessage:
          "¡Hola! 👋 Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte hoy?",
        awayMessage:
          "Gracias por contactarnos. Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00. Te responderemos pronto.",
      })
      .$returningId();
    return db.query.botConfiguration.findFirst({
      where: eq(botConfiguration.id, result[0].id),
    });
  }
  return configs[0];
}

export async function updateBotConfiguration(
  id: number,
  data: Partial<InsertBotConfiguration>
) {
  const db = getDb();
  await db
    .update(botConfiguration)
    .set(data)
    .where(eq(botConfiguration.id, id));
  return db.query.botConfiguration.findFirst({
    where: eq(botConfiguration.id, id),
  });
}

// ─── WhatsApp Config ───────────────────────────────────────────────

export async function getWhatsappConfig() {
  const db = getDb();
  const configs = await db.query.whatsappConfig.findMany({ limit: 1 });
  return configs[0] || null;
}

export async function updateWhatsappConfig(
  id: number,
  data: Partial<InsertWhatsappConfig>
) {
  const db = getDb();
  await db.update(whatsappConfig).set(data).where(eq(whatsappConfig.id, id));
  return db.query.whatsappConfig.findFirst({
    where: eq(whatsappConfig.id, id),
  });
}

export async function createOrUpdateWhatsappConfig(
  data: Partial<InsertWhatsappConfig>
) {
  const db = getDb();
  const existing = await getWhatsappConfig();
  if (existing) {
    return updateWhatsappConfig(existing.id, data);
  }
  const result = await db.insert(whatsappConfig).values(data).$returningId();
  return db.query.whatsappConfig.findFirst({
    where: eq(whatsappConfig.id, result[0].id),
  });
}

// ─── Webhook Logs ──────────────────────────────────────────────────

export async function createWebhookLog(
  eventType: string,
  payload: Record<string, unknown>
) {
  const db = getDb();
  return db.insert(webhookLogs).values({
    eventType,
    payload,
  });
}

export async function getRecentWebhookLogs(limit: number = 50) {
  const db = getDb();
  return db.query.webhookLogs.findMany({
    orderBy: [desc(webhookLogs.createdAt)],
    limit,
  });
}
