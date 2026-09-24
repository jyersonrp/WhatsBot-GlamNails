import type { WhatsAppDriver, SendMessageOptions, SendMessageResult } from "./types";

export class MockWhatsAppDriver implements WhatsAppDriver {
  readonly name = "mock";

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    console.log(`[MockWhatsAppDriver] 🚀 Outgoing message to ${options.to}:`, {
      text: options.text,
      mediaUrl: options.mediaUrl,
      mediaType: options.mediaType,
    });

    const fakeId = `mock_wamid_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      success: true,
      messageId: fakeId,
    };
  }
}
