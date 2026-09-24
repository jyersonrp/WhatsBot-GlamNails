import type { WhatsAppDriver, SendMessageOptions, SendMessageResult } from "./types";
import { env } from "../../lib/env";

export class MetaCloudApiDriver implements WhatsAppDriver {
  readonly name = "meta";
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion = "v21.0";

  constructor(phoneNumberId?: string, accessToken?: string) {
    this.phoneNumberId = phoneNumberId || env.whatsappPhoneNumberId;
    this.accessToken = accessToken || env.whatsappAccessToken;
  }

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    if (!this.phoneNumberId || !this.accessToken) {
      const err = "Meta Cloud API credentials (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN) are missing.";
      console.error(`[MetaCloudApiDriver] ${err}`);
      return {
        success: false,
        error: err,
      };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    // Clean phone number (remove +, spaces, hyphens)
    const recipient = options.to.replace(/[^\d]/g, "");

    let body: Record<string, unknown>;

    if (options.mediaUrl && options.mediaType === "image") {
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "image",
        image: {
          link: options.mediaUrl,
          caption: options.text,
        },
      };
    } else {
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: {
          preview_url: false,
          body: options.text || "",
        },
      };
    }

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = (await resp.json()) as { error?: { message?: string }; messages?: Array<{ id?: string }> };
      if (!resp.ok) {
        console.error("[MetaCloudApiDriver] Error response from Meta:", data);
        return {
          success: false,
          error: data?.error?.message || "Failed to send message via Meta Cloud API",
          details: data,
        };
      }

      const messageId = data?.messages?.[0]?.id;
      return {
        success: true,
        messageId,
        details: data,
      };
    } catch (err: unknown) {
      console.error("[MetaCloudApiDriver] Network error:", err);
      return {
        success: false,
        error: (err as Error)?.message || "Network error communicating with Meta Graph API",
      };
    }
  }
}
