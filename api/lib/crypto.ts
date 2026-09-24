import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import * as jose from "jose";
import { env } from "./env";

const scryptAsync = promisify(scrypt);

/**
 * Hash a password using scrypt with a cryptographically secure salt.
 * Returns format: "salt:derivedKey"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a plain text password against a stored "salt:derivedKey" scrypt hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const keyBuffer = Buffer.from(key, "hex");
    if (derivedKey.length !== keyBuffer.length) return false;
    return timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

export type SessionPayload = {
  userId: number;
  email: string;
  role: "admin" | "agent";
  name: string;
};

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.appSecret);
}

/**
 * Sign a JWT session token valid for 30 days.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new jose.SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

/**
 * Verify a JWT session token and return the payload if valid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      role: payload.role as "admin" | "agent",
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}
