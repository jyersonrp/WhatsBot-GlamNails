import { eq, count } from "drizzle-orm";
import * as schema from "@db/schema";
import type { User, InsertUser } from "@db/schema";
import { getDb } from "./connection";

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0];
}

export async function findUserById(id: number): Promise<User | undefined> {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows[0];
}

export async function createUser(data: InsertUser): Promise<User> {
  const rows = await getDb()
    .insert(schema.users)
    .values({
      ...data,
      email: data.email.toLowerCase().trim(),
    })
    .returning();
  return rows[0];
}

export async function updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
  const rows = await getDb()
    .update(schema.users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, id))
    .returning();
  return rows[0];
}

export async function countUsers(): Promise<number> {
  const result = await getDb()
    .select({ count: count() })
    .from(schema.users);
  return Number(result[0]?.count ?? 0);
}
