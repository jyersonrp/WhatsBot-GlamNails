import { getDb } from "./connection";
import { botRules, type InsertBotRule, type BotRule } from "@db/schema";
import { eq, asc } from "drizzle-orm";
import { matchRuleInMemory } from "../services/botRulesEngine";

export async function findAllBotRules(activeOnly?: boolean): Promise<BotRule[]> {
  const db = getDb();
  if (activeOnly) {
    return db.query.botRules.findMany({
      where: eq(botRules.isActive, true),
      orderBy: [asc(botRules.priority)],
    });
  }
  return db.query.botRules.findMany({
    orderBy: [asc(botRules.priority)],
  });
}

export async function findBotRuleById(id: number): Promise<BotRule | undefined> {
  const db = getDb();
  return db.query.botRules.findFirst({
    where: eq(botRules.id, id),
  });
}

export async function createBotRule(data: InsertBotRule): Promise<BotRule> {
  const db = getDb();
  const rows = await db.insert(botRules).values(data).returning();
  return rows[0];
}

export async function updateBotRule(id: number, data: Partial<InsertBotRule>): Promise<BotRule | undefined> {
  const db = getDb();
  const rows = await db.update(botRules).set(data).where(eq(botRules.id, id)).returning();
  return rows[0];
}

export async function deleteBotRule(id: number): Promise<{ id: number }> {
  const db = getDb();
  await db.delete(botRules).where(eq(botRules.id, id));
  return { id };
}

export async function toggleBotRule(id: number): Promise<BotRule | undefined> {
  const rule = await findBotRuleById(id);
  if (!rule) return undefined;
  return updateBotRule(id, { isActive: !rule.isActive });
}

// Bot response matching logic using the normalized engine
export async function findMatchingRule(message: string): Promise<BotRule | null> {
  const rules = await findAllBotRules(true);
  return matchRuleInMemory(message, rules);
}
