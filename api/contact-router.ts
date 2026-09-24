import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findAllContacts,
  findContactById,
  findContactByPhone,
  createContact,
  updateContact,
  deleteContact,
} from "./queries/contacts";

export const contactRouter = createRouter({
  list: authedQuery
    .input(z.object({ search: z.string().optional() }).optional())
    .query(({ input }) => findAllContacts(input?.search)),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findContactById(input.id)),

  byPhone: authedQuery
    .input(z.object({ phone: z.string() }))
    .query(({ input }) => findContactByPhone(input.phone)),

  create: authedQuery
    .input(
      z.object({
        phoneNumber: z.string().min(1),
        name: z.string().optional(),
        email: z.string().email().optional(),
        notes: z.string().optional(),
        labels: z.any().optional(),
      })
    )
    .mutation(({ input }) => {
      const labelsStr = input.labels ? JSON.stringify(input.labels) : undefined;
      return createContact({
        phoneNumber: input.phoneNumber,
        name: input.name,
        email: input.email,
        notes: input.notes,
        labels: labelsStr,
      });
    }),

  update: authedQuery
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
    .mutation(({ input }) => {
      const { id, data } = input;
      const labelsStr = data.labels !== undefined ? JSON.stringify(data.labels) : undefined;
      return updateContact(id, {
        ...data,
        labels: labelsStr,
      });
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteContact(input.id)),
});
