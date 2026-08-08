import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
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
} from "./queries/conversations";

export const conversationRouter = createRouter({
  list: publicQuery
    .input(
      z
        .object({
          status: z.enum(["active", "archived", "pending"]).optional(),
        })
        .optional()
    )
    .query(({ input }) => findAllConversations(input?.status)),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findConversationById(input.id)),

  byPhone: publicQuery
    .input(z.object({ phone: z.string() }))
    .query(({ input }) => findConversationByPhone(input.phone)),

  create: publicQuery
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

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          contactName: z.string().optional(),
          status: z.enum(["active", "archived", "pending"]).optional(),
          assignedTo: z.number().optional(),
          lastMessage: z.string().optional(),
        }),
      })
    )
    .mutation(({ input }) => updateConversation(input.id, input.data)),

  archive: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => archiveConversation(input.id)),

  resetUnread: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => resetUnread(input.id)),

  recent: publicQuery
    .input(z.object({ limit: z.number().default(5) }).optional())
    .query(({ input }) => getRecentConversations(input?.limit || 5)),

  messages: publicQuery
    .input(z.object({ conversationId: z.number() }))
    .query(({ input }) => getConversationMessages(input.conversationId)),
});
