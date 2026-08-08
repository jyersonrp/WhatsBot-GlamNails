import { getDb } from "./connection";
import {
  conversations,
  messages,
  type InsertConversation,
} from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function findAllConversations(status?: string) {
  const db = getDb();
  const conditions = [];
  if (status) {
    conditions.push(eq(conversations.status, status as "active" | "archived" | "pending"));
  }

  return db.query.conversations.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(conversations.lastMessageAt)],
    with: {
      assignedUser: true,
    },
  });
}

export async function findConversationById(id: number) {
  const db = getDb();
  return db.query.conversations.findFirst({
    where: eq(conversations.id, id),
    with: {
      assignedUser: true,
    },
  });
}

export async function findConversationByPhone(phone: string) {
  const db = getDb();
  return db.query.conversations.findFirst({
    where: eq(conversations.phoneNumber, phone),
  });
}

export async function createConversation(data: InsertConversation) {
  const db = getDb();
  const result = await db
    .insert(conversations)
    .values(data)
    .$returningId();
  return findConversationById(result[0].id);
}

export async function updateConversation(
  id: number,
  data: Partial<InsertConversation>
) {
  const db = getDb();
  await db.update(conversations).set(data).where(eq(conversations.id, id));
  return findConversationById(id);
}

export async function archiveConversation(id: number) {
  return updateConversation(id, { status: "archived" });
}

export async function incrementUnread(id: number) {
  const db = getDb();
  await db
    .update(conversations)
    .set({
      unreadCount: sql`${conversations.unreadCount} + 1`,
    })
    .where(eq(conversations.id, id));
  return findConversationById(id);
}

export async function resetUnread(id: number) {
  return updateConversation(id, { unreadCount: 0 });
}

export async function getRecentConversations(limit: number = 5) {
  const db = getDb();
  return db.query.conversations.findMany({
    orderBy: [desc(conversations.lastMessageAt)],
    limit,
    with: {
      assignedUser: true,
    },
  });
}

export async function getConversationMessages(conversationId: number) {
  const db = getDb();
  return db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [messages.createdAt],
  });
}
