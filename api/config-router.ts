import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  getBotConfiguration,
  updateBotConfiguration,
  getWhatsappConfig,
  createOrUpdateWhatsappConfig,
} from "./queries/configuration";

export const configRouter = createRouter({
  // Bot Configuration
  getBotConfig: publicQuery.query(() => getBotConfiguration()),

  updateBotConfig: publicQuery
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
      const { id, ...data } = input;
      return updateBotConfiguration(id, data);
    }),

  // WhatsApp Configuration
  getWhatsappConfig: publicQuery.query(() => getWhatsappConfig()),

  updateWhatsappConfig: publicQuery
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
