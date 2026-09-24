import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  findAllTemplates,
  findTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "./queries/templates";

export const templateRouter = createRouter({
  list: authedQuery.query(() => findAllTemplates()),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findTemplateById(input.id)),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum(["marketing", "utility", "authentication"]),
        language: z.string().default("es"),
        content: z.string().min(1),
        variables: z.any().optional(),
      })
    )
    .mutation(({ input }) => {
      const varsStr = input.variables ? JSON.stringify(input.variables) : undefined;
      return createTemplate({
        name: input.name,
        category: input.category,
        language: input.language,
        content: input.content,
        variables: varsStr,
      });
    }),

  update: adminQuery
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
    .mutation(({ input }) => {
      const { id, data } = input;
      const varsStr = data.variables !== undefined ? JSON.stringify(data.variables) : undefined;
      return updateTemplate(id, {
        ...data,
        variables: varsStr,
      });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTemplate(input.id)),

  submit: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      updateTemplate(input.id, { status: "pending" })
    ),
});
