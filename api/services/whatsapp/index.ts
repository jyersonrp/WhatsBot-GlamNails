import { env } from "../../lib/env";
import type { WhatsAppDriver } from "./types";
import { MockWhatsAppDriver } from "./mockDriver";
import { MetaCloudApiDriver } from "./metaDriver";

export * from "./types";
export * from "./mockDriver";
export * from "./metaDriver";

let driverInstance: WhatsAppDriver | null = null;

export function getWhatsAppDriver(): WhatsAppDriver {
  if (!driverInstance) {
    if (env.whatsappMode === "meta" && env.whatsappPhoneNumberId && env.whatsappAccessToken) {
      console.log("[WhatsAppDriver] Initialized MetaCloudApiDriver (Production Meta Graph API v21.0)");
      driverInstance = new MetaCloudApiDriver();
    } else {
      console.log("[WhatsAppDriver] Initialized MockWhatsAppDriver (Local Simulator Mode)");
      driverInstance = new MockWhatsAppDriver();
    }
  }
  return driverInstance;
}
