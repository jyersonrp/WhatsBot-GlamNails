import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import {
  findAllServices,
  findServiceById,
  createService,
  updateService,
  deleteService,
} from "./queries/services";

export const serviceRouter = createRouter({
  list: publicQuery
    .input(z.object({ activeOnly: z.boolean().optional() }).optional())
    .query(({ input }) => findAllServices(input?.activeOnly)),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findServiceById(input.id)),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1, "El nombre del servicio es requerido"),
        description: z.string().optional(),
        priceUsd: z.number().min(0, "El precio debe ser un número positivo"),
        durationMinutes: z.number().default(60),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(({ input }) => createService(input)),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          priceUsd: z.number().optional(),
          durationMinutes: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(({ input }) => updateService(input.id, input.data)),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteService(input.id)),
});
