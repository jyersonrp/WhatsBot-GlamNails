import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  getBotConfiguration,
} from "./queries/configuration";
import {
  findConversationByPhone,
  createConversation,
  incrementUnread,
  updateConversation,
} from "./queries/conversations";
import { createMessage } from "./queries/messages";
import { processBotMessage } from "./services/botRulesEngine";
import { getWhatsAppDriver } from "./services/whatsapp";

export const webhookRouter = createRouter({
  // Verify endpoint for testing or tRPC calls
  verify: publicQuery
    .input(
      z.object({
        mode: z.string().optional(),
        verifyToken: z.string().optional(),
        challenge: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      if (input.mode === "subscribe" && input.challenge) {
        return { challenge: input.challenge };
      }
      return { ok: true };
    }),

  // Interactive WhatsApp Web Simulator in CRM
  simulate: publicQuery
    .input(
      z.object({
        phoneNumber: z.string().min(1),
        message: z.string().min(1),
        contactName: z.string().optional(),
        mediaUrl: z.string().optional(),
        mediaType: z.enum(["image", "document"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Find or create conversation
      let conversation = await findConversationByPhone(input.phoneNumber);
      if (!conversation) {
        conversation = await createConversation({
          phoneNumber: input.phoneNumber,
          contactName: input.contactName || `Clienta ${input.phoneNumber.slice(-4)}`,
          status: "active",
        });
      }

      if (!conversation) {
        return { success: false, error: "No se pudo crear la conversación." };
      }

      // Save customer message
      const customerMsg = await createMessage({
        conversationId: conversation.id,
        sender: "customer",
        content: input.message,
        messageType: input.mediaUrl ? "image" : "text",
        mediaUrl: input.mediaUrl,
        status: "read",
      });

      await incrementUnread(conversation.id);

      // Check if bot is muted for human operator control
      if (conversation.isBotMuted) {
        return {
          success: true,
          conversationId: conversation.id,
          customerMessageId: customerMsg.id,
          botResponse: null,
          isBotMuted: true,
          notice: "El bot está silenciado para esta conversación. Una asesora humana debe responder.",
        };
      }

      // Process bot response
      const botConfig = await getBotConfiguration();
      if (!botConfig?.isActive) {
        return {
          success: true,
          conversationId: conversation.id,
          customerMessageId: customerMsg.id,
          botResponse: null,
          notice: "El bot se encuentra desactivado en la configuración general.",
        };
      }

      const botResult = await processBotMessage(input.message);

      // Save bot response
      const botMsg = await createMessage({
        conversationId: conversation.id,
        sender: "bot",
        content: botResult.responseContent,
        messageType: "text",
        status: "delivered",
      });

      // Update conversation last message
      await updateConversation(conversation.id, {
        lastMessage: botResult.responseContent,
        lastMessageAt: new Date(),
      });

      // Send to driver (logs in mock driver)
      const driver = getWhatsAppDriver();
      await driver.sendMessage({
        to: input.phoneNumber,
        text: botResult.responseContent,
      });

      return {
        success: true,
        conversationId: conversation.id,
        customerMessageId: customerMsg.id,
        botResponse: {
          id: botMsg.id,
          content: botMsg.content,
          ruleName: botResult.matchedRuleName,
          source: botResult.source,
        },
      };
    }),
});
