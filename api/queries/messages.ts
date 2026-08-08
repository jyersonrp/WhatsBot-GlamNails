import { getDb } from "./connection";
import { messages, conversations, type InsertMessage } from "@db/schema";
import { eq, sql } from "drizzle-orm";

export async function findMessagesByConversation(conversationId: number) {
  const db = getDb();
  return db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [messages.createdAt],
  });
}

export async function createMessage(data: InsertMessage) {
  const db = getDb();
  const result = await db.insert(messages).values(data).$returningId();

  // Update conversation last message
  await db
    .update(conversations)
    .set({
      lastMessage: data.content,
      lastMessageAt: new Date(),
    })
    .where(eq(conversations.id, data.conversationId));

  return db.query.messages.findFirst({
    where: eq(messages.id, result[0].id),
  });
}

export async function updateMessageStatus(
  id: number,
  status: "sent" | "delivered" | "read" | "failed"
) {
  const db = getDb();
  await db.update(messages).set({ status }).where(eq(messages.id, id));
  return db.query.messages.findFirst({ where: eq(messages.id, id) });
}

export async function getMessageCountSince(date: Date) {
  const db = getDb();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(sql`${messages.createdAt} >= ${date}`);
  return result[0].count;
}

export async function getMessageCountBySender(sender: "customer" | "bot" | "agent") {
  const db = getDb();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.sender, sender));
  return result[0].count;
}

export async function getMessagesByDay(days: number = 7) {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db
    .select({
      date: sql<string>`DATE(${messages.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(messages)
    .where(sql`${messages.createdAt} >= ${since}`)
    .groupBy(sql`DATE(${messages.createdAt})`)
    .orderBy(sql`DATE(${messages.createdAt})`);
}
