import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  findAllAppointments,
  findAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentStats,
} from "./queries/appointments";
import { createMessage } from "./queries/messages";
import { findConversationByPhone, createConversation } from "./queries/conversations";
import { getWhatsAppDriver } from "./services/whatsapp";

async function notifyAppointmentConfirmed(appointmentId: number) {
  const apt = await findAppointmentById(appointmentId);
  if (!apt || !apt.clientPhone) return;

  const dateObj = new Date(apt.scheduledAt);
  const dateStr = dateObj.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = dateObj.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const serviceName = apt.service?.name || "Servicio de uñas";
  const confirmationText =
    `✅ *¡Cita Confirmada en Glam Nails!* 💅\n\n` +
    `Hola ${apt.clientName}, tu cita para *${serviceName}* ha sido confirmada para el *${dateStr}* a las *${timeStr}*.\n\n` +
    `📍 Te esperamos en Av. Bicentenario, C.C. Plaza Girasol, local 12, Maturín. ¡Gracias por elegirnos!`;

  // Find or create conversation for logging
  let convId = apt.conversationId;
  if (!convId) {
    let conv = await findConversationByPhone(apt.clientPhone);
    if (!conv) {
      conv = await createConversation({
        phoneNumber: apt.clientPhone,
        contactName: apt.clientName,
        status: "active",
      });
    }
    convId = conv?.id;
    if (convId) {
      await updateAppointment(appointmentId, { conversationId: convId });
    }
  }

  if (convId) {
    await createMessage({
      conversationId: convId,
      sender: "agent",
      content: confirmationText,
      messageType: "text",
      status: "sent",
    });
  }

  // Dispatch outgoing confirmation via WhatsApp driver
  const driver = getWhatsAppDriver();
  await driver.sendMessage({
    to: apt.clientPhone,
    text: confirmationText,
  });
}

export const appointmentRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          status: z
            .enum(["pendiente", "confirmada", "cancelada", "completada"])
            .optional(),
          clientPhone: z.string().optional(),
        })
        .optional()
    )
    .query(({ input }) => findAllAppointments(input)),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findAppointmentById(input.id)),

  stats: authedQuery.query(() => getAppointmentStats()),

  create: authedQuery
    .input(
      z.object({
        clientName: z.string().min(1, "El nombre de la clienta es requerido"),
        clientPhone: z.string().min(1, "El teléfono es requerido"),
        serviceId: z.number().optional(),
        conversationId: z.number().optional(),
        scheduledAt: z.coerce.date(),
        status: z
          .enum(["pendiente", "confirmada", "cancelada", "completada"])
          .default("pendiente"),
        notes: z.string().optional(),
        paymentProofUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let convId = input.conversationId;
      if (!convId && input.clientPhone) {
        let conv = await findConversationByPhone(input.clientPhone);
        if (!conv) {
          conv = await createConversation({
            phoneNumber: input.clientPhone,
            contactName: input.clientName,
            status: "active",
          });
        }
        convId = conv?.id;
      }

      const created = await createAppointment({
        ...input,
        conversationId: convId,
      });

      if (input.status === "confirmada" && created) {
        await notifyAppointmentConfirmed(created.id);
      }

      return created;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          clientName: z.string().optional(),
          clientPhone: z.string().optional(),
          serviceId: z.number().optional(),
          scheduledAt: z.coerce.date().optional(),
          status: z
            .enum(["pendiente", "confirmada", "cancelada", "completada"])
            .optional(),
          notes: z.string().optional(),
          paymentProofUrl: z.string().optional(),
        }),
      })
    )
    .mutation(({ input }) => updateAppointment(input.id, input.data)),

  updateStatus: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pendiente", "confirmada", "cancelada", "completada"]),
      })
    )
    .mutation(async ({ input }) => {
      const updated = await updateAppointmentStatus(input.id, input.status);

      if (input.status === "confirmada" && updated) {
        await notifyAppointmentConfirmed(input.id);
      }

      return updated;
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteAppointment(input.id)),
});
