import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findAllBotRules,
  findBotRuleById,
  createBotRule,
  updateBotRule,
  deleteBotRule,
  toggleBotRule,
  findMatchingRule,
} from "./queries/botRules";

export const botRouter = createRouter({
  list: publicQuery
    .input(z.object({ activeOnly: z.boolean().optional() }).optional())
    .query(({ input }) => findAllBotRules(input?.activeOnly)),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findBotRuleById(input.id)),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        triggerType: z.enum(["keyword", "exact", "contains", "regex", "default"]),
        triggerValue: z.string().min(1),
        responseType: z.enum(["text", "template", "flow"]),
        responseContent: z.string().min(1),
        templateName: z.string().optional(),
        priority: z.number().default(0),
      })
    )
    .mutation(({ input }) =>
      createBotRule({
        name: input.name,
        triggerType: input.triggerType,
        triggerValue: input.triggerValue,
        responseType: input.responseType,
        responseContent: input.responseContent,
        templateName: input.templateName,
        priority: input.priority,
      })
    ),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          triggerType: z
            .enum(["keyword", "exact", "contains", "regex", "default"])
            .optional(),
          triggerValue: z.string().optional(),
          responseType: z.enum(["text", "template", "flow"]).optional(),
          responseContent: z.string().optional(),
          templateName: z.string().optional(),
          isActive: z.boolean().optional(),
          priority: z.number().optional(),
        }),
      })
    )
    .mutation(({ input }) => updateBotRule(input.id, input.data)),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBotRule(input.id)),

  toggle: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => toggleBotRule(input.id)),

  match: publicQuery
    .input(z.object({ message: z.string() }))
    .query(({ input }) => findMatchingRule(input.message)),
});
