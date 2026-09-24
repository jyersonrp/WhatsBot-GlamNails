import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findAllConversations,
  findConversationById,
  findConversationByPhone,
  createConversation,
  updateConversation,
  archiveConversation,
  resetUnread,
  getRecentConversations,
  getConversationMessages,
  setBotMuted,
} from "./queries/conversations";

export const conversationRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          status: z.enum(["active", "archived", "pending"]).optional(),
        })
        .optional()
    )
    .query(({ input }) => findAllConversations(input?.status)),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findConversationById(input.id)),

  byPhone: authedQuery
    .input(z.object({ phone: z.string() }))
    .query(({ input }) => findConversationByPhone(input.phone)),

  create: authedQuery
    .input(
      z.object({
        phoneNumber: z.string().min(1),
        contactName: z.string().optional(),
        status: z.enum(["active", "archived", "pending"]).optional(),
      })
    )
    .mutation(({ input }) =>
      createConversation({
        phoneNumber: input.phoneNumber,
        contactName: input.contactName,
        status: input.status || "active",
      })
    ),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          contactName: z.string().optional(),
          status: z.enum(["active", "archived", "pending"]).optional(),
          assignedTo: z.number().optional(),
          lastMessage: z.string().optional(),
          isBotMuted: z.boolean().optional(),
        }),
      })
    )
    .mutation(({ input }) => updateConversation(input.id, input.data)),

  toggleBotMuted: authedQuery
    .input(
      z.object({
        id: z.number(),
        isBotMuted: z.boolean(),
      })
    )
    .mutation(({ input }) => setBotMuted(input.id, input.isBotMuted)),

  archive: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => archiveConversation(input.id)),

  resetUnread: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => resetUnread(input.id)),

  recent: authedQuery
    .input(z.object({ limit: z.number().default(5) }).optional())
    .query(({ input }) => getRecentConversations(input?.limit || 5)),

  messages: authedQuery
    .input(z.object({ conversationId: z.number() }))
    .query(({ input }) => getConversationMessages(input.conversationId)),
});
