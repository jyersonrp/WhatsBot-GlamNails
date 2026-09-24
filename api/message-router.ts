import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findMessagesByConversation,
  createMessage,
  updateMessageStatus,
  getMessageCountSince,
  getMessagesByDay,
} from "./queries/messages";
import { findConversationById } from "./queries/conversations";
import { getWhatsAppDriver } from "./services/whatsapp";

export const messageRouter = createRouter({
  list: authedQuery
    .input(z.object({ conversationId: z.number() }))
    .query(({ input }) => findMessagesByConversation(input.conversationId)),

  create: authedQuery
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1),
        sender: z.enum(["customer", "bot", "agent"]).default("agent"),
        messageType: z.enum(["text", "template", "image", "document"]).default("text"),
        mediaUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const msg = await createMessage({
        conversationId: input.conversationId,
        content: input.content,
        sender: input.sender,
        messageType: input.messageType,
        mediaUrl: input.mediaUrl,
        status: "sent",
      });

      // Dispatch outgoing message via WhatsApp Driver if sender is agent
      if (input.sender === "agent") {
        const conversation = await findConversationById(input.conversationId);
        if (conversation?.phoneNumber) {
          const driver = getWhatsAppDriver();
          await driver.sendMessage({
            to: conversation.phoneNumber,
            text: input.content,
            mediaUrl: input.mediaUrl,
            mediaType: input.messageType === "image" ? "image" : undefined,
          });
        }
      }

      return msg;
    }),

  updateStatus: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["sent", "delivered", "read", "failed"]),
      })
    )
    .mutation(({ input }) => updateMessageStatus(input.id, input.status)),

  countSince: authedQuery
    .input(z.object({ date: z.date() }))
    .query(({ input }) => getMessageCountSince(input.date)),

  byDay: authedQuery
    .input(z.object({ days: z.number().default(7) }).optional())
    .query(({ input }) => getMessagesByDay(input?.days || 7)),
});
