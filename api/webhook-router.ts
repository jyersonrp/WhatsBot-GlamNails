import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  createWebhookLog,
  getBotConfiguration,
} from "./queries/configuration";
import {
  findConversationByPhone,
  createConversation,
  incrementUnread,
} from "./queries/conversations";
import { createMessage } from "./queries/messages";
import { findMatchingRule } from "./queries/botRules";

export const webhookRouter = createRouter({
  // GET /api/webhook — verification endpoint for Meta
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

  // POST /api/webhook — receive messages
  receive: publicQuery
    .input(z.any())
    .mutation(async ({ input }) => {
      try {
        // Log the webhook
        await createWebhookLog("incoming_message", input as Record<string, unknown>);

        // Extract message data from WhatsApp webhook payload
        const entry = input.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const messageData = value?.messages?.[0];

        if (!messageData) {
          return { received: true, processed: false, reason: "no_message" };
        }

        const from = messageData.from; // phone number
        const text = messageData.text?.body || "";
        const messageId = messageData.id;

        // Find or create conversation
        let conversation = await findConversationByPhone(from);
        if (!conversation) {
          conversation = await createConversation({
            phoneNumber: from,
            contactName: `Contacto ${from.slice(-4)}`,
            status: "active",
          });
        }

        if (!conversation) {
          return { received: true, processed: false, reason: "no_conversation" };
        }

        // Save customer message
        await createMessage({
          conversationId: conversation.id,
          sender: "customer",
          content: text,
          messageType: "text",
          whatsappMessageId: messageId,
          status: "delivered",
        });

        // Increment unread
        await incrementUnread(conversation.id);

        // Process bot response
        const botConfig = await getBotConfiguration();
        let botResponse = null;

        if (botConfig?.isActive) {
          const matchingRule = await findMatchingRule(text);

          if (matchingRule) {
            // Save bot message
            botResponse = await createMessage({
              conversationId: conversation.id,
              sender: "bot",
              content: matchingRule.responseContent,
              messageType: matchingRule.responseType === "template" ? "template" : "text",
            });

            // Update conversation last message
            const { updateConversation } = await import("./queries/conversations");
            await updateConversation(conversation.id, {
              lastMessage: matchingRule.responseContent,
              lastMessageAt: new Date(),
            });
          }
        }

        return {
          received: true,
          processed: true,
          conversationId: conversation.id,
          botResponse: botResponse
            ? { id: botResponse?.id, content: botResponse?.content }
            : null,
        };
      } catch (error) {
        console.error("Webhook processing error:", error);
        return { received: true, processed: false, error: "processing_failed" };
      }
    }),

  // Simulate receiving a message (for demo/testing)
  simulate: publicQuery
    .input(
      z.object({
        phoneNumber: z.string().min(1),
        message: z.string().min(1),
        contactName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Find or create conversation
      let conversation = await findConversationByPhone(input.phoneNumber);
      if (!conversation) {
        conversation = await createConversation({
          phoneNumber: input.phoneNumber,
          contactName: input.contactName || `Contacto ${input.phoneNumber.slice(-4)}`,
          status: "active",
        });
      }

      if (!conversation) {
        return { success: false, error: "Could not create conversation" };
      }

      // Save customer message
      await createMessage({
        conversationId: conversation.id,
        sender: "customer",
        content: input.message,
        messageType: "text",
        status: "read",
      });

      await incrementUnread(conversation.id);

      // Process bot response
      const botConfig = await getBotConfiguration();
      let botResponse = null;
      let matchedRule = null;

      if (botConfig?.isActive) {
        const matchingRule = await findMatchingRule(input.message);
        matchedRule = matchingRule;

        if (matchingRule) {
          botResponse = await createMessage({
            conversationId: conversation.id,
            sender: "bot",
            content: matchingRule.responseContent,
            messageType:
              matchingRule.responseType === "template" ? "template" : "text",
          });

          const { updateConversation } = await import("./queries/conversations");
          await updateConversation(conversation.id, {
            lastMessage: matchingRule.responseContent,
            lastMessageAt: new Date(),
          });
        }
      }

      return {
        success: true,
        conversationId: conversation.id,
        botResponse: botResponse
          ? { id: botResponse.id, content: botResponse.content }
          : null,
        matchedRule: matchedRule
          ? { name: matchedRule.name, triggerType: matchedRule.triggerType }
          : null,
      };
    }),
});
