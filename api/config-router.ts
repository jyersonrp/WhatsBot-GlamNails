import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  getBotConfiguration,
  updateBotConfiguration,
  getWhatsappConfig,
  createOrUpdateWhatsappConfig,
} from "./queries/configuration";

export const configRouter = createRouter({
  // Bot Configuration
  getBotConfig: authedQuery.query(() => getBotConfiguration()),

  updateBotConfig: authedQuery
    .input(
      z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        welcomeMessage: z.string().optional(),
        awayMessage: z.string().optional(),
        businessHoursStart: z.string().optional(),
        businessHoursEnd: z.string().optional(),
        businessDays: z.any().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, businessDays, ...data } = input;
      const daysStr = typeof businessDays === "string" ? businessDays : JSON.stringify(businessDays);
      return updateBotConfiguration(id, {
        ...data,
        businessDays: daysStr,
      });
    }),

  // WhatsApp Configuration
  getWhatsappConfig: adminQuery.query(() => getWhatsappConfig()),

  updateWhatsappConfig: adminQuery
    .input(
      z.object({
        phoneNumberId: z.string().optional(),
        accessToken: z.string().optional(),
        wabaId: z.string().optional(),
        verifyToken: z.string().optional(),
        webhookUrl: z.string().optional(),
        isConnected: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => createOrUpdateWhatsappConfig(input)),
});
