import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findAllContacts,
  findContactById,
  findContactByPhone,
  createContact,
  updateContact,
  deleteContact,
} from "./queries/contacts";

export const contactRouter = createRouter({
  list: publicQuery
    .input(z.object({ search: z.string().optional() }).optional())
    .query(({ input }) => findAllContacts(input?.search)),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findContactById(input.id)),

  byPhone: publicQuery
    .input(z.object({ phone: z.string() }))
    .query(({ input }) => findContactByPhone(input.phone)),

  create: publicQuery
    .input(
      z.object({
        phoneNumber: z.string().min(1),
        name: z.string().optional(),
        email: z.string().email().optional(),
        notes: z.string().optional(),
        labels: z.any().optional(),
      })
    )
    .mutation(({ input }) =>
      createContact({
        phoneNumber: input.phoneNumber,
        name: input.name,
        email: input.email,
        notes: input.notes,
        labels: input.labels,
      })
    ),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          notes: z.string().optional(),
          labels: z.any().optional(),
          isOptedIn: z.boolean().optional(),
        }),
      })
    )
    .mutation(({ input }) => updateContact(input.id, input.data)),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteContact(input.id)),
});
