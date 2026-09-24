import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { conversations, messages, botRules, contacts, appointments, services } from "@db/schema";
import { eq, sql, and, desc, asc, or } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: authedQuery.query(async () => {
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

    // Bot messages today
    const botMessagesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.sender, "bot"),
          sql`${messages.createdAt} >= ${today}`
        )
      );

    const totalMessages = Number(messagesTodayResult[0]?.count || 0);
    const botMessages = Number(botMessagesResult[0]?.count || 0);
    const botResolutionRate = totalMessages > 0 ? Math.round((botMessages / totalMessages) * 100) : 100;

    // Total contacts
    const contactsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts);

    // Active bot rules
    const rulesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(botRules)
      .where(eq(botRules.isActive, true));

    // Total and pending appointments
    const appointmentsResult = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(case when ${appointments.status} = 'pendiente' then 1 end)`,
        confirmed: sql<number>`count(case when ${appointments.status} = 'confirmada' then 1 end)`,
      })
      .from(appointments);

    // Today's appointments
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayAppointmentsResult = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(case when ${appointments.status} = 'pendiente' then 1 end)`,
        confirmed: sql<number>`count(case when ${appointments.status} = 'confirmada' then 1 end)`,
      })
      .from(appointments)
      .where(
        and(
          sql`${appointments.scheduledAt} >= ${startOfToday}`,
          sql`${appointments.scheduledAt} <= ${endOfToday}`
        )
      );

    // Upcoming appointments (today and forward)
    const upcomingAppointments = await db.query.appointments.findMany({
      where: sql`${appointments.scheduledAt} >= ${startOfToday}`,
      orderBy: [asc(appointments.scheduledAt)],
      limit: 6,
      with: {
        service: true,
      },
    });

    // Chats needing attention (active with unread messages or muted bot)
    const chatsNeedingAttention = await db.query.conversations.findMany({
      where: and(
        eq(conversations.status, "active"),
        or(
          sql`${conversations.unreadCount} > 0`,
          eq(conversations.isBotMuted, true)
        )
      ),
      orderBy: [desc(conversations.lastMessageAt)],
      limit: 5,
    });

    // Top requested services
    const activeServices = await db.query.services.findMany({
      where: eq(services.isActive, true),
      limit: 10,
    });
    const aptsByService = await db
      .select({
        serviceId: appointments.serviceId,
        count: sql<number>`count(*)`,
      })
      .from(appointments)
      .groupBy(appointments.serviceId);

    const serviceCountMap = new Map<number, number>();
    aptsByService.forEach((r) => {
      if (r.serviceId) serviceCountMap.set(r.serviceId, Number(r.count));
    });

    const topServices = activeServices
      .map((s) => ({
        id: s.id,
        name: s.name,
        priceUsd: s.priceUsd,
        durationMinutes: s.durationMinutes,
        count: serviceCountMap.get(s.id) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

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

    // Estimated Revenue (USD & Bs referencial BCV)
    const BCV_RATE = 70.0; // Tasa referencial oficial BCV Monagas / Venezuela

    const allConfirmedOrCompletedApts = await db.query.appointments.findMany({
      where: or(
        eq(appointments.status, "confirmada"),
        eq(appointments.status, "completada")
      ),
      with: {
        service: true,
      },
    });

    const totalRevenueUsd = allConfirmedOrCompletedApts.reduce(
      (sum, apt) => sum + (apt.service?.priceUsd || 0),
      0
    );

    const todayConfirmedApts = allConfirmedOrCompletedApts.filter((apt) => {
      const d = new Date(apt.scheduledAt);
      return d >= startOfToday && d <= endOfToday;
    });

    const todayRevenueUsd = todayConfirmedApts.reduce(
      (sum, apt) => sum + (apt.service?.priceUsd || 0),
      0
    );

    const totalAptsCount = Number(appointmentsResult[0]?.total || 0);
    const confirmedAptsCount = Number(appointmentsResult[0]?.confirmed || 0);
    const completedAptsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.status, "completada"));
    const completedAptsCount = Number(completedAptsResult[0]?.count || 0);

    const confirmationRate = totalAptsCount > 0
      ? Math.round(((confirmedAptsCount + completedAptsCount) / totalAptsCount) * 100)
      : 100;

    return {
      activeConversations: Number(activeConvResult[0]?.count || 0),
      messagesToday: totalMessages,
      botResolutionRate,
      totalContacts: Number(contactsResult[0]?.count || 0),
      activeBotRules: Number(rulesResult[0]?.count || 0),
      totalAppointments: Number(appointmentsResult[0]?.total || 0),
      pendingAppointments: Number(appointmentsResult[0]?.pending || 0),
      confirmedAppointments: Number(appointmentsResult[0]?.confirmed || 0),
      todayAppointments: Number(todayAppointmentsResult[0]?.total || 0),
      todayPendingAppointments: Number(todayAppointmentsResult[0]?.pending || 0),
      todayConfirmedAppointments: Number(todayAppointmentsResult[0]?.confirmed || 0),
      estimatedRevenueUsd: totalRevenueUsd,
      estimatedRevenueBs: Math.round(totalRevenueUsd * BCV_RATE),
      todayEstimatedRevenueUsd: todayRevenueUsd,
      todayEstimatedRevenueBs: Math.round(todayRevenueUsd * BCV_RATE),
      bcvRate: BCV_RATE,
      confirmationRate,
      upcomingAppointments,
      chatsNeedingAttention,
      topServices,
      dailyMessages,
      messagesBySender,
    };
  }),

  recentConversations: authedQuery.query(async () => {
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
