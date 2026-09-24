import { getDb } from "./connection";
import { messages, conversations, type InsertMessage, type Message } from "@db/schema";
import { eq, sql } from "drizzle-orm";

export async function findMessagesByConversation(conversationId: number): Promise<Message[]> {
  const db = getDb();
  return db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [messages.createdAt],
  });
}

export async function createMessage(data: InsertMessage): Promise<Message> {
  const db = getDb();
  const rows = await db.insert(messages).values(data).returning();
  const message = rows[0];

  // Update conversation last message and lastMessageAt
  await db
    .update(conversations)
    .set({
      lastMessage: data.content,
      lastMessageAt: new Date(),
    })
    .where(eq(conversations.id, data.conversationId));

  return message;
}

export async function updateMessageStatus(
  id: number,
  status: "sent" | "delivered" | "read" | "failed"
): Promise<Message | undefined> {
  const db = getDb();
  const rows = await db.update(messages).set({ status }).where(eq(messages.id, id)).returning();
  return rows[0];
}

export async function getMessageCountSince(date: Date): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(sql`${messages.createdAt} >= ${date}`);
  return Number(result[0]?.count ?? 0);
}

export async function getMessageCountBySender(sender: "customer" | "bot" | "agent"): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.sender, sender));
  return Number(result[0]?.count ?? 0);
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
