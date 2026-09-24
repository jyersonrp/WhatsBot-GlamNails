CREATE TYPE "public"."appointment_status" AS ENUM('pendiente', 'confirmada', 'cancelada', 'completada');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('active', 'archived', 'pending');--> statement-breakpoint
CREATE TYPE "public"."message_sender" AS ENUM('customer', 'bot', 'agent');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'template', 'image', 'document');--> statement-breakpoint
CREATE TYPE "public"."response_type" AS ENUM('text', 'template', 'flow');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('marketing', 'utility', 'authentication');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('draft', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."trigger_type" AS ENUM('keyword', 'exact', 'contains', 'regex', 'default');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'agent');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"contact_id" integer,
	"service_id" integer,
	"client_name" varchar(255) NOT NULL,
	"client_phone" varchar(30) NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"status" "appointment_status" DEFAULT 'pendiente' NOT NULL,
	"notes" text,
	"payment_proof_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_configuration" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"welcome_message" text NOT NULL,
	"away_message" text,
	"business_hours_start" varchar(5) DEFAULT '09:00',
	"business_hours_end" varchar(5) DEFAULT '17:00',
	"business_days" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"trigger_type" "trigger_type" NOT NULL,
	"trigger_value" varchar(500) NOT NULL,
	"response_type" "response_type" NOT NULL,
	"response_content" text NOT NULL,
	"template_name" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" varchar(30) NOT NULL,
	"name" varchar(255),
	"email" varchar(320),
	"notes" text,
	"labels" text,
	"is_opted_in" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" varchar(30) NOT NULL,
	"contact_name" varchar(255),
	"status" "conversation_status" DEFAULT 'active' NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_message" text,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"assigned_to" integer,
	"is_bot_muted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "template_category" NOT NULL,
	"language" varchar(10) DEFAULT 'es' NOT NULL,
	"content" text NOT NULL,
	"variables" text,
	"status" "template_status" DEFAULT 'draft' NOT NULL,
	"whatsapp_template_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender" "message_sender" DEFAULT 'customer' NOT NULL,
	"content" text NOT NULL,
	"message_type" "message_type" DEFAULT 'text' NOT NULL,
	"media_url" text,
	"whatsapp_message_id" varchar(255),
	"status" "message_status" DEFAULT 'sent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price_usd" integer NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar" text,
	"role" "user_role" DEFAULT 'agent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_sign_in_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" text NOT NULL,
	"status" varchar(50) DEFAULT 'received' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number_id" varchar(255),
	"access_token" text,
	"waba_id" varchar(255),
	"verify_token" varchar(255),
	"webhook_url" text,
	"is_connected" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_scheduled_at_idx" ON "appointments" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "appointments_client_phone_idx" ON "appointments" USING btree ("client_phone");--> statement-breakpoint
CREATE INDEX "contacts_phone_idx" ON "contacts" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "conversations_phone_number_idx" ON "conversations" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "conversations_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversations_last_message_at_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhook_created_at_idx" ON "webhook_logs" USING btree ("created_at");