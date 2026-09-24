export interface SendMessageOptions {
  to: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: "image" | "document";
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: unknown;
}

export interface WhatsAppDriver {
  readonly name: string;
  sendMessage(options: SendMessageOptions): Promise<SendMessageResult>;
}
