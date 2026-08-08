import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  json,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users (Auth System) ───────────────────────────────────────────

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Conversations ─────────────────────────────────────────────────

export const conversations = mysqlTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }),
    status: mysqlEnum("status", ["active", "archived", "pending"])
      .default("active")
      .notNull(),
    unreadCount: int("unread_count").default(0).notNull(),
    lastMessage: text("last_message"),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    assignedTo: bigint("assigned_to", {
      mode: "number",
      unsigned: true,
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    phoneNumberIdx: index("phone_number_idx").on(table.phoneNumber),
    statusIdx: index("status_idx").on(table.status),
    lastMessageAtIdx: index("last_message_at_idx").on(table.lastMessageAt),
  })
);

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Messages ──────────────────────────────────────────────────────

export const messages = mysqlTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: bigint("conversation_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    sender: mysqlEnum("sender", ["customer", "bot", "agent"])
      .notNull()
      .default("customer"),
    content: text("content").notNull(),
    messageType: mysqlEnum("message_type", ["text", "template", "image", "document"])
      .default("text")
      .notNull(),
    whatsappMessageId: varchar("whatsapp_message_id", { length: 255 }),
    status: mysqlEnum("status", ["sent", "delivered", "read", "failed"])
      .default("sent")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIdx: index("conversation_id_idx").on(table.conversationId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  })
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Bot Rules ─────────────────────────────────────────────────────

export const botRules = mysqlTable("bot_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  triggerType: mysqlEnum("trigger_type", [
    "keyword",
    "exact",
    "contains",
    "regex",
    "default",
  ]).notNull(),
  triggerValue: varchar("trigger_value", { length: 500 }).notNull(),
  responseType: mysqlEnum("response_type", ["text", "template", "flow"])
    .notNull(),
  responseContent: text("response_content").notNull(),
  templateName: varchar("template_name", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  priority: int("priority").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BotRule = typeof botRules.$inferSelect;
export type InsertBotRule = typeof botRules.$inferInsert;

// ─── Message Templates ─────────────────────────────────────────────

export const messageTemplates = mysqlTable("message_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["marketing", "utility", "authentication"])
    .notNull(),
  language: varchar("language", { length: 10 }).default("es").notNull(),
  content: text("content").notNull(),
  variables: json("variables"),
  status: mysqlEnum("status", ["draft", "pending", "approved", "rejected"])
    .default("draft")
    .notNull(),
  whatsappTemplateId: varchar("whatsapp_template_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;

// ─── Contacts ──────────────────────────────────────────────────────

export const contacts = mysqlTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }),
    notes: text("notes"),
    labels: json("labels"),
    isOptedIn: boolean("is_opted_in").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    phoneNumberIdx: index("contacts_phone_idx").on(table.phoneNumber),
  })
);

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── Webhook Logs ──────────────────────────────────────────────────

export const webhookLogs = mysqlTable(
  "webhook_logs",
  {
    id: serial("id").primaryKey(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: json("payload").notNull(),
    status: mysqlEnum("status", ["received", "processed", "failed"])
      .default("received")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("webhook_created_at_idx").on(table.createdAt),
  })
);

export type WebhookLog = typeof webhookLogs.$inferSelect;

// ─── Bot Configuration ─────────────────────────────────────────────

export const botConfiguration = mysqlTable("bot_configuration", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").default(true).notNull(),
  welcomeMessage: text("welcome_message").notNull(),
  awayMessage: text("away_message"),
  businessHoursStart: varchar("business_hours_start", { length: 5 }).default("09:00"),
  businessHoursEnd: varchar("business_hours_end", { length: 5 }).default("18:00"),
  businessDays: json("business_days"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type BotConfiguration = typeof botConfiguration.$inferSelect;
export type InsertBotConfiguration = typeof botConfiguration.$inferInsert;

// ─── WhatsApp API Configuration ────────────────────────────────────

export const whatsappConfig = mysqlTable("whatsapp_config", {
  id: serial("id").primaryKey(),
  phoneNumberId: varchar("phone_number_id", { length: 255 }),
  accessToken: text("access_token"),
  wabaId: varchar("waba_id", { length: 255 }),
  verifyToken: varchar("verify_token", { length: 255 }),
  webhookUrl: text("webhook_url"),
  isConnected: boolean("is_connected").default(false),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfig.$inferInsert;
