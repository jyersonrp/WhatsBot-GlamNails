import { getDb } from "./connection";
import { contacts, type InsertContact } from "@db/schema";
import { eq, like } from "drizzle-orm";

export async function findAllContacts(search?: string) {
  const db = getDb();
  if (search) {
    return db.query.contacts.findMany({
      where: like(contacts.name, `%${search}%`),
    });
  }
  return db.query.contacts.findMany();
}

export async function findContactById(id: number) {
  const db = getDb();
  return db.query.contacts.findFirst({
    where: eq(contacts.id, id),
  });
}

export async function findContactByPhone(phone: string) {
  const db = getDb();
  return db.query.contacts.findFirst({
    where: eq(contacts.phoneNumber, phone),
  });
}

export async function createContact(data: InsertContact) {
  const db = getDb();
  const result = await db.insert(contacts).values(data).$returningId();
  return findContactById(result[0].id);
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = getDb();
  await db.update(contacts).set(data).where(eq(contacts.id, id));
  return findContactById(id);
}

export async function deleteContact(id: number) {
  const db = getDb();
  await db.delete(contacts).where(eq(contacts.id, id));
  return { id };
}
