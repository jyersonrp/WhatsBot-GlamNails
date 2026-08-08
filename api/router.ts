import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { conversationRouter } from "./conversation-router";
import { messageRouter } from "./message-router";
import { botRouter } from "./bot-router";
import { templateRouter } from "./template-router";
import { contactRouter } from "./contact-router";
import { configRouter } from "./config-router";
import { dashboardRouter } from "./dashboard-router";
import { webhookRouter } from "./webhook-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  conversation: conversationRouter,
  message: messageRouter,
  bot: botRouter,
  template: templateRouter,
  contact: contactRouter,
  config: configRouter,
  dashboard: dashboardRouter,
  webhook: webhookRouter,
});

export type AppRouter = typeof appRouter;
