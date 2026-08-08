import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findAllTemplates,
  findTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "./queries/templates";

export const templateRouter = createRouter({
  list: publicQuery.query(() => findAllTemplates()),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findTemplateById(input.id)),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum(["marketing", "utility", "authentication"]),
        language: z.string().default("es"),
        content: z.string().min(1),
        variables: z.any().optional(),
      })
    )
    .mutation(({ input }) =>
      createTemplate({
        name: input.name,
        category: input.category,
        language: input.language,
        content: input.content,
        variables: input.variables,
      })
    ),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          category: z
            .enum(["marketing", "utility", "authentication"])
            .optional(),
          content: z.string().optional(),
          variables: z.any().optional(),
          status: z.enum(["draft", "pending", "approved", "rejected"]).optional(),
        }),
      })
    )
    .mutation(({ input }) => updateTemplate(input.id, input.data)),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTemplate(input.id)),

  submit: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      updateTemplate(input.id, { status: "pending" })
    ),
});
