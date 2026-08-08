import { getDb } from "./connection";
import { messageTemplates, type InsertMessageTemplate } from "@db/schema";
import { eq } from "drizzle-orm";

export async function findAllTemplates() {
  const db = getDb();
  return db.query.messageTemplates.findMany({
    orderBy: [messageTemplates.createdAt],
  });
}

export async function findTemplateById(id: number) {
  const db = getDb();
  return db.query.messageTemplates.findFirst({
    where: eq(messageTemplates.id, id),
  });
}

export async function createTemplate(data: InsertMessageTemplate) {
  const db = getDb();
  const result = await db.insert(messageTemplates).values(data).$returningId();
  return findTemplateById(result[0].id);
}

export async function updateTemplate(id: number, data: Partial<InsertMessageTemplate>) {
  const db = getDb();
  await db.update(messageTemplates).set(data).where(eq(messageTemplates.id, id));
  return findTemplateById(id);
}

export async function deleteTemplate(id: number) {
  const db = getDb();
  await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
  return { id };
}
