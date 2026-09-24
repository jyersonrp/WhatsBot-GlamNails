import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createWebhookLog, getBotConfiguration } from "./queries/configuration";
import {
  findConversationByPhone,
  createConversation,
  incrementUnread,
  updateConversation,
} from "./queries/conversations";
import { createMessage } from "./queries/messages";
import { processBotMessage } from "./services/botRulesEngine";
import { getWhatsAppDriver } from "./services/whatsapp";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// ─── Meta WhatsApp Cloud API Webhook Handshake (GET) ────────────────
app.get("/api/webhook", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  const expectedToken = env.whatsappVerifyToken || "glamnails_webhook_verify_token_2026";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("[Webhook Handshake] Meta verification successful. Returning hub.challenge.");
    return c.text(challenge || "", 200);
  }

  console.warn("[Webhook Handshake] Token mismatch or invalid mode.");
  return c.text("Forbidden", 403);
});

// ─── Meta WhatsApp Cloud API Webhook Receiver (POST) ────────────────
app.post("/api/webhook", async (c) => {
  try {
    const rawBody = await c.req.text();
    const signature = c.req.header("X-Hub-Signature-256") || c.req.header("x-hub-signature-256");

    // Optional HMAC SHA256 Signature verification if secret is provided
    if (env.whatsappAppSecret && signature) {
      const crypto = await import("node:crypto");
      const expectedSig =
        "sha256=" +
        crypto.createHmac("sha256", env.whatsappAppSecret).update(rawBody).digest("hex");
      if (signature !== expectedSig) {
        console.error("[Webhook] Invalid HMAC SHA256 signature.");
        return c.json({ error: "Invalid signature" }, 401);
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    // Log the raw webhook payload
    await createWebhookLog("incoming_whatsapp_webhook", payload);

    // Parse Meta messages structure
    const entry = (payload?.entry as Array<Record<string, unknown>>)?.[0];
    const change = (entry?.changes as Array<Record<string, unknown>>)?.[0];
    const value = change?.value as Record<string, unknown> | undefined;
    const messagesList = value?.messages as Array<Record<string, unknown>> | undefined;
    const messageData = messagesList?.[0];

    if (!messageData) {
      return c.json({ status: "acknowledged", notice: "No message in event" }, 200);
    }

    const from = String(messageData.from || "");
    const textObj = messageData.text as { body?: string } | undefined;
    const imageObj = messageData.image as { id?: string; caption?: string; mime_type?: string } | undefined;
    const isImage = messageData.type === "image";
    const text = textObj?.body || imageObj?.caption || (isImage ? "📷 Imagen recibida" : "");
    const messageId = String(messageData.id || "");

    const contactsList = value?.contacts as Array<{ profile?: { name?: string } }> | undefined;
    const contactName = contactsList?.[0]?.profile?.name || `Clienta ${from.slice(-4)}`;

    // Find or create conversation
    let conversation = await findConversationByPhone(from);
    if (!conversation) {
      conversation = await createConversation({
        phoneNumber: from,
        contactName,
        status: "active",
      });
    }

    const mediaUrl = isImage && imageObj?.id ? `https://graph.facebook.com/v21.0/${imageObj.id}` : undefined;

    // Save incoming message
    await createMessage({
      conversationId: conversation.id,
      sender: "customer",
      content: text,
      messageType: isImage ? "image" : "text",
      mediaUrl,
      whatsappMessageId: messageId,
      status: "delivered",
    });

    await incrementUnread(conversation.id);

    // If conversation is muted, skip bot auto-reply
    if (conversation.isBotMuted) {
      console.log(`[Webhook] Conversation ${conversation.id} is bot-muted. Awaiting human agent.`);
      return c.json({ status: "muted_bot" }, 200);
    }

    // Bot processing
    const botConfig = await getBotConfiguration();
    if (botConfig?.isActive) {
      const botResult = await processBotMessage(text);

      await createMessage({
        conversationId: conversation.id,
        sender: "bot",
        content: botResult.responseContent,
        messageType: "text",
        status: "sent",
      });

      await updateConversation(conversation.id, {
        lastMessage: botResult.responseContent,
        lastMessageAt: new Date(),
      });

      // Dispatch outgoing reply via WhatsApp driver
      const driver = getWhatsAppDriver();
      await driver.sendMessage({
        to: from,
        text: botResult.responseContent,
      });
    }

    return c.json({ status: "success" }, 200);
  } catch (error) {
    console.error("[Webhook Error]:", error);
    return c.json({ error: "Internal processing error" }, 500);
  }
});

// ─── tRPC Handler ──────────────────────────────────────────────────
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

declare const IS_STANDALONE: boolean | undefined;

const isStandaloneRun =
  (typeof IS_STANDALONE !== "undefined" && IS_STANDALONE) ||
  env.isProduction ||
  Boolean(process.argv[1] && process.argv[1].replace(/\\/g, "/").includes("dist/boot"));

if (isStandaloneRun) {
  // Run database migrations and seed automatically on standalone startup
  try {
    const { initDatabase } = await import("./lib/db-init");
    await initDatabase();
  } catch (initErr) {
    console.warn("[Startup] Database auto-init error:", initErr);
  }

  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`🌸 Glam Nails WhatsBot running on http://localhost:${port}/`);
  });
}
