import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ─────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "agent"]);
export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "archived",
  "pending",
]);
export const messageSenderEnum = pgEnum("message_sender", [
  "customer",
  "bot",
  "agent",
]);
export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "template",
  "image",
  "document",
]);
export const messageStatusEnum = pgEnum("message_status", [
  "sent",
  "delivered",
  "read",
  "failed",
]);
export const triggerTypeEnum = pgEnum("trigger_type", [
  "keyword",
  "exact",
  "contains",
  "regex",
  "default",
]);
export const responseTypeEnum = pgEnum("response_type", [
  "text",
  "template",
  "flow",
]);
export const templateCategoryEnum = pgEnum("template_category", [
  "marketing",
  "utility",
  "authentication",
]);
export const templateStatusEnum = pgEnum("template_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
]);

// ─── Users (Native Auth System) ────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("agent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignInAt: timestamp("last_sign_in_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Services (Catálogo Glam Nails) ────────────────────────────────

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceUsd: integer("price_usd").notNull(),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Conversations ─────────────────────────────────────────────────

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }),
    status: conversationStatusEnum("status").default("active").notNull(),
    unreadCount: integer("unread_count").default(0).notNull(),
    lastMessage: text("last_message"),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    assignedTo: integer("assigned_to"),
    isBotMuted: boolean("is_bot_muted").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    phoneNumberIdx: index("conversations_phone_number_idx").on(table.phoneNumber),
    statusIdx: index("conversations_status_idx").on(table.status),
    lastMessageAtIdx: index("conversations_last_message_at_idx").on(table.lastMessageAt),
  })
);

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Appointments (Citas) ──────────────────────────────────────────

export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id"),
    contactId: integer("contact_id"),
    serviceId: integer("service_id").references(() => services.id),
    clientName: varchar("client_name", { length: 255 }).notNull(),
    clientPhone: varchar("client_phone", { length: 30 }).notNull(),
    scheduledAt: timestamp("scheduled_at").notNull(),
    status: appointmentStatusEnum("status").default("pendiente").notNull(),
    notes: text("notes"),
    paymentProofUrl: text("payment_proof_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("appointments_status_idx").on(table.status),
    scheduledAtIdx: index("appointments_scheduled_at_idx").on(table.scheduledAt),
    clientPhoneIdx: index("appointments_client_phone_idx").on(table.clientPhone),
  })
);

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ─── Messages ──────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id").notNull(),
    sender: messageSenderEnum("sender").notNull().default("customer"),
    content: text("content").notNull(),
    messageType: messageTypeEnum("message_type").default("text").notNull(),
    mediaUrl: text("media_url"),
    whatsappMessageId: varchar("whatsapp_message_id", { length: 255 }),
    status: messageStatusEnum("status").default("sent").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  })
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Bot Rules ─────────────────────────────────────────────────────

export const botRules = pgTable("bot_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  triggerType: triggerTypeEnum("trigger_type").notNull(),
  triggerValue: varchar("trigger_value", { length: 500 }).notNull(),
  responseType: responseTypeEnum("response_type").notNull(),
  responseContent: text("response_content").notNull(),
  templateName: varchar("template_name", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BotRule = typeof botRules.$inferSelect;
export type InsertBotRule = typeof botRules.$inferInsert;

// ─── Message Templates ─────────────────────────────────────────────

export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: templateCategoryEnum("category").notNull(),
  language: varchar("language", { length: 10 }).default("es").notNull(),
  content: text("content").notNull(),
  variables: text("variables"),
  status: templateStatusEnum("status").default("draft").notNull(),
  whatsappTemplateId: varchar("whatsapp_template_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;

// ─── Contacts ──────────────────────────────────────────────────────

export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }),
    notes: text("notes"),
    labels: text("labels"),
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

export const webhookLogs = pgTable(
  "webhook_logs",
  {
    id: serial("id").primaryKey(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: text("payload").notNull(),
    status: varchar("status", { length: 50 }).default("received").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("webhook_created_at_idx").on(table.createdAt),
  })
);

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;

// ─── Bot Configuration ─────────────────────────────────────────────

export const botConfiguration = pgTable("bot_configuration", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").default(true).notNull(),
  welcomeMessage: text("welcome_message").notNull(),
  awayMessage: text("away_message"),
  businessHoursStart: varchar("business_hours_start", { length: 5 }).default("09:00"),
  businessHoursEnd: varchar("business_hours_end", { length: 5 }).default("17:00"),
  businessDays: text("business_days"), // JSON string
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BotConfiguration = typeof botConfiguration.$inferSelect;
export type InsertBotConfiguration = typeof botConfiguration.$inferInsert;

// ─── WhatsApp API Configuration ────────────────────────────────────

export const whatsappConfig = pgTable("whatsapp_config", {
  id: serial("id").primaryKey(),
  phoneNumberId: varchar("phone_number_id", { length: 255 }),
  accessToken: text("access_token"),
  wabaId: varchar("waba_id", { length: 255 }),
  verifyToken: varchar("verify_token", { length: 255 }),
  webhookUrl: text("webhook_url"),
  isConnected: boolean("is_connected").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfig.$inferInsert;
