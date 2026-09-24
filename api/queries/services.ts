import { getDb } from "./connection";
import { services, type InsertService, type Service } from "@db/schema";
import { eq, asc } from "drizzle-orm";

export async function findAllServices(activeOnly?: boolean): Promise<Service[]> {
  const db = getDb();
  if (activeOnly) {
    return db.query.services.findMany({
      where: eq(services.isActive, true),
      orderBy: [asc(services.priceUsd)],
    });
  }
  return db.query.services.findMany({
    orderBy: [asc(services.priceUsd)],
  });
}

export async function findServiceById(id: number): Promise<Service | undefined> {
  const db = getDb();
  return db.query.services.findFirst({
    where: eq(services.id, id),
  });
}

export async function createService(data: InsertService): Promise<Service> {
  const db = getDb();
  const rows = await db.insert(services).values(data).returning();
  return rows[0];
}

export async function updateService(
  id: number,
  data: Partial<InsertService>
): Promise<Service | undefined> {
  const db = getDb();
  const rows = await db.update(services).set(data).where(eq(services.id, id)).returning();
  return rows[0];
}

export async function deleteService(id: number): Promise<{ id: number }> {
  const db = getDb();
  await db.delete(services).where(eq(services.id, id));
  return { id };
}
