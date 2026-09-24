import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./lib/crypto";
import { findUserById } from "./queries/users";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const cookieHeader = opts.req.headers.get("cookie");
    if (cookieHeader) {
      const parsed = cookie.parse(cookieHeader);
      const token = parsed[Session.cookieName];
      if (token) {
        const payload = await verifySessionToken(token);
        if (payload?.userId) {
          const user = await findUserById(payload.userId);
          if (user) {
            ctx.user = user;
          }
        }
      }
    }
  } catch {
    // Session token invalid or user not found
  }
  return ctx;
}
