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
    const rows = await db
      .insert(botConfiguration)
      .values({
        welcomeMessage:
          "¡Hola! 💅 Bienvenida a *Glam Nails Maturín*. ¿En qué te ayudo hoy?",
        awayMessage:
          "Gracias por escribir a *Glam Nails Maturín* 💅. Nuestro horario de atención es de martes a sábado de 9:00 a 17:00.",
        businessHoursStart: "09:00",
        businessHoursEnd: "17:00",
        businessDays: JSON.stringify(["tuesday", "wednesday", "thursday", "friday", "saturday"]),
      })
      .returning();
    return rows[0];
  }
  return configs[0];
}

export async function updateBotConfiguration(
  id: number,
  data: Partial<InsertBotConfiguration>
) {
  const db = getDb();
  const rows = await db
    .update(botConfiguration)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(botConfiguration.id, id))
    .returning();
  return rows[0];
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
  const rows = await db
    .update(whatsappConfig)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(whatsappConfig.id, id))
    .returning();
  return rows[0];
}

export async function createOrUpdateWhatsappConfig(
  data: Partial<InsertWhatsappConfig>
) {
  const existing = await getWhatsappConfig();
  if (existing) {
    return updateWhatsappConfig(existing.id, data);
  }
  const db = getDb();
  const rows = await db.insert(whatsappConfig).values(data).returning();
  return rows[0];
}

// ─── Webhook Logs ──────────────────────────────────────────────────

export async function createWebhookLog(
  eventType: string,
  payload: Record<string, unknown>
) {
  const db = getDb();
  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  const rows = await db.insert(webhookLogs).values({
    eventType,
    payload: payloadStr,
    status: "received",
  }).returning();
  return rows[0];
}

export async function getRecentWebhookLogs(limit: number = 50) {
  const db = getDb();
  return db.query.webhookLogs.findMany({
    orderBy: [desc(webhookLogs.createdAt)],
    limit,
  });
}
