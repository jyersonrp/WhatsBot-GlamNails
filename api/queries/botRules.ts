import { getDb } from "./connection";
import { botRules, type InsertBotRule } from "@db/schema";
import { eq, asc } from "drizzle-orm";

export async function findAllBotRules(activeOnly?: boolean) {
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

export async function findBotRuleById(id: number) {
  const db = getDb();
  return db.query.botRules.findFirst({
    where: eq(botRules.id, id),
  });
}

export async function createBotRule(data: InsertBotRule) {
  const db = getDb();
  const result = await db.insert(botRules).values(data).$returningId();
  return findBotRuleById(result[0].id);
}

export async function updateBotRule(id: number, data: Partial<InsertBotRule>) {
  const db = getDb();
  await db.update(botRules).set(data).where(eq(botRules.id, id));
  return findBotRuleById(id);
}

export async function deleteBotRule(id: number) {
  const db = getDb();
  await db.delete(botRules).where(eq(botRules.id, id));
  return { id };
}

export async function toggleBotRule(id: number) {
  const rule = await findBotRuleById(id);
  if (!rule) return null;
  return updateBotRule(id, { isActive: !rule.isActive });
}

// Bot response matching logic
export async function findMatchingRule(message: string): Promise<InsertBotRule | null> {
  const rules = await findAllBotRules(true);
  const lowerMessage = message.toLowerCase().trim();

  for (const rule of rules) {
    const triggerValue = rule.triggerValue.toLowerCase();

    switch (rule.triggerType) {
      case "exact":
        if (lowerMessage === triggerValue) return rule;
        break;
      case "keyword":
        const keywords = triggerValue.split(",").map((k) => k.trim());
        if (keywords.some((kw) => lowerMessage.includes(kw))) return rule;
        break;
      case "contains":
        if (lowerMessage.includes(triggerValue)) return rule;
        break;
      case "regex":
        try {
          const regex = new RegExp(triggerValue, "i");
          if (regex.test(message)) return rule;
        } catch {
          continue;
        }
        break;
      case "default":
        // Default rule matches everything but should be last
        break;
    }
  }

  // Return default rule if no match
  const defaultRule = rules.find((r) => r.triggerType === "default");
  if (defaultRule) return defaultRule;

  return null;
}
