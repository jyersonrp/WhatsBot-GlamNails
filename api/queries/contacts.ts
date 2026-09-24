import { getDb } from "./connection";
import { contacts, type InsertContact, type Contact } from "@db/schema";
import { eq, ilike } from "drizzle-orm";

export async function findAllContacts(search?: string): Promise<Contact[]> {
  const db = getDb();
  if (search) {
    return db.query.contacts.findMany({
      where: ilike(contacts.name, `%${search}%`),
    });
  }
  return db.query.contacts.findMany();
}

export async function findContactById(id: number): Promise<Contact | undefined> {
  const db = getDb();
  return db.query.contacts.findFirst({
    where: eq(contacts.id, id),
  });
}

export async function findContactByPhone(phone: string): Promise<Contact | undefined> {
  const db = getDb();
  return db.query.contacts.findFirst({
    where: eq(contacts.phoneNumber, phone),
  });
}

export async function createContact(data: InsertContact): Promise<Contact> {
  const db = getDb();
  const rows = await db.insert(contacts).values(data).returning();
  return rows[0];
}

export async function updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined> {
  const db = getDb();
  const rows = await db.update(contacts).set(data).where(eq(contacts.id, id)).returning();
  return rows[0];
}

export async function deleteContact(id: number): Promise<{ id: number }> {
  const db = getDb();
  await db.delete(contacts).where(eq(contacts.id, id));
  return { id };
}
