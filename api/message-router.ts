import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findMessagesByConversation,
  createMessage,
  updateMessageStatus,
  getMessageCountSince,
  getMessagesByDay,
} from "./queries/messages";

export const messageRouter = createRouter({
  list: publicQuery
    .input(z.object({ conversationId: z.number() }))
    .query(({ input }) => findMessagesByConversation(input.conversationId)),

  create: publicQuery
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1),
        sender: z.enum(["customer", "bot", "agent"]).default("agent"),
        messageType: z.enum(["text", "template", "image", "document"]).default("text"),
      })
    )
    .mutation(({ input }) =>
      createMessage({
        conversationId: input.conversationId,
        content: input.content,
        sender: input.sender,
        messageType: input.messageType,
      })
    ),

  updateStatus: publicQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["sent", "delivered", "read", "failed"]),
      })
    )
    .mutation(({ input }) => updateMessageStatus(input.id, input.status)),

  countSince: publicQuery
    .input(z.object({ date: z.date() }))
    .query(({ input }) => getMessageCountSince(input.date)),

  byDay: publicQuery
    .input(z.object({ days: z.number().default(7) }).optional())
    .query(({ input }) => getMessagesByDay(input?.days || 7)),
});
