import { getDb } from "./connection";
import { appointments, services, conversations, type InsertAppointment, type Appointment } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export type AppointmentWithDetails = Appointment & {
  service?: typeof services.$inferSelect | null;
  conversation?: typeof conversations.$inferSelect | null;
};

export async function findAllAppointments(filters?: {
  status?: "pendiente" | "confirmada" | "cancelada" | "completada";
  clientPhone?: string;
}): Promise<AppointmentWithDetails[]> {
  const db = getDb();
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(appointments.status, filters.status));
  }
  if (filters?.clientPhone) {
    conditions.push(eq(appointments.clientPhone, filters.clientPhone));
  }

  return db.query.appointments.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(appointments.scheduledAt)],
    with: {
      service: true,
      conversation: true,
    },
  });
}

export async function findAppointmentById(id: number): Promise<AppointmentWithDetails | undefined> {
  const db = getDb();
  return db.query.appointments.findFirst({
    where: eq(appointments.id, id),
    with: {
      service: true,
      conversation: true,
    },
  });
}

export async function createAppointment(data: InsertAppointment): Promise<Appointment> {
  const db = getDb();
  const rows = await db.insert(appointments).values(data).returning();
  return rows[0];
}

export async function updateAppointment(
  id: number,
  data: Partial<InsertAppointment>
): Promise<Appointment | undefined> {
  const db = getDb();
  const rows = await db
    .update(appointments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, id))
    .returning();
  return rows[0];
}

export async function updateAppointmentStatus(
  id: number,
  status: "pendiente" | "confirmada" | "cancelada" | "completada"
): Promise<Appointment | undefined> {
  return updateAppointment(id, { status });
}

export async function deleteAppointment(id: number): Promise<{ id: number }> {
  const db = getDb();
  await db.delete(appointments).where(eq(appointments.id, id));
  return { id };
}

export async function getAppointmentStats() {
  const all = await findAllAppointments();
  return {
    total: all.length,
    pendientes: all.filter((a) => a.status === "pendiente").length,
    confirmadas: all.filter((a) => a.status === "confirmada").length,
    canceladas: all.filter((a) => a.status === "cancelada").length,
    completadas: all.filter((a) => a.status === "completada").length,
  };
}
