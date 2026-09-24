import { getDb } from "./connection";
import { messageTemplates, type InsertMessageTemplate, type MessageTemplate } from "@db/schema";
import { eq } from "drizzle-orm";

export async function findAllTemplates(): Promise<MessageTemplate[]> {
  const db = getDb();
  return db.query.messageTemplates.findMany({
    orderBy: [messageTemplates.createdAt],
  });
}

export async function findTemplateById(id: number): Promise<MessageTemplate | undefined> {
  const db = getDb();
  return db.query.messageTemplates.findFirst({
    where: eq(messageTemplates.id, id),
  });
}

export async function createTemplate(data: InsertMessageTemplate): Promise<MessageTemplate> {
  const db = getDb();
  const rows = await db.insert(messageTemplates).values(data).returning();
  return rows[0];
}

export async function updateTemplate(
  id: number,
  data: Partial<InsertMessageTemplate>
): Promise<MessageTemplate | undefined> {
  const db = getDb();
  const rows = await db.update(messageTemplates).set(data).where(eq(messageTemplates.id, id)).returning();
  return rows[0];
}

export async function deleteTemplate(id: number): Promise<{ id: number }> {
  const db = getDb();
  await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
  return { id };
}
