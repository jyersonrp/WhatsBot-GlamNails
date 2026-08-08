import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { conversations, messages, botRules, contacts } from "@db/schema";
import { eq, sql, and, desc } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: publicQuery.query(async () => {
    const db = getDb();

    // Active conversations count
    const activeConvResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(eq(conversations.status, "active"));

    // Total messages today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= ${today}`);

    // Bot resolution rate (bot messages / total messages today)
    const botMessagesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.sender, "bot"),
          sql`${messages.createdAt} >= ${today}`
        )
      );

    const totalMessages = messagesTodayResult[0].count || 1;
    const botMessages = botMessagesResult[0].count || 0;
    const botResolutionRate = Math.round((botMessages / totalMessages) * 100);

    // Total contacts
    const contactsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts);

    // Active bot rules
    const rulesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(botRules)
      .where(eq(botRules.isActive, true));

    // Recent activity (last 7 days messages)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const dailyMessages = await db
      .select({
        date: sql<string>`DATE(${messages.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(messages)
      .where(sql`${messages.createdAt} >= ${last7Days}`)
      .groupBy(sql`DATE(${messages.createdAt})`)
      .orderBy(sql`DATE(${messages.createdAt})`);

    // Messages by sender type
    const messagesBySender = await db
      .select({
        sender: messages.sender,
        count: sql<number>`count(*)`,
      })
      .from(messages)
      .groupBy(messages.sender);

    return {
      activeConversations: activeConvResult[0].count,
      messagesToday: messagesTodayResult[0].count,
      botResolutionRate,
      totalContacts: contactsResult[0].count,
      activeBotRules: rulesResult[0].count,
      dailyMessages,
      messagesBySender,
    };
  }),

  recentConversations: publicQuery.query(async () => {
    const db = getDb();
    return db.query.conversations.findMany({
      orderBy: [desc(conversations.lastMessageAt)],
      limit: 5,
      with: {
        assignedUser: true,
      },
    });
  }),
});
