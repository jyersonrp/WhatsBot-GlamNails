import { z } from "zod";
import * as cookie from "cookie";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery } from "./middleware";
import { findUserByEmail, createUser, countUsers } from "./queries/users";
import { hashPassword, verifyPassword, signSessionToken } from "./lib/crypto";

export const authRouter = createRouter({
  // Check current session
  me: publicQuery.query(({ ctx }) => {
    if (!ctx.user) return null;
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      avatar: ctx.user.avatar,
    };
  }),

  // Email and password login
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1, "La contraseña es requerida"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await findUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Credenciales inválidas. Verifica tu correo y contraseña.",
        });
      }

      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Credenciales inválidas. Verifica tu correo y contraseña.",
        });
      }

      // Generate signed JWT token
      const token = await signSessionToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  // Logout session
  logout: publicQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      })
    );
    return { success: true };
  }),

  // Seed default admin account if database is empty
  seedAdmin: publicQuery
    .input(
      z
        .object({
          email: z.string().email().optional(),
          password: z.string().min(6).optional(),
          name: z.string().optional(),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      const total = await countUsers();
      if (total > 0) {
        return { created: false, message: "Ya existen usuarios en la base de datos." };
      }

      const adminEmail = input?.email || "admin@glamnails.com";
      const adminPassword = input?.password || "admin123456";
      const adminName = input?.name || "Administrador Glam Nails";

      const passwordHash = await hashPassword(adminPassword);
      const newUser = await createUser({
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: "admin",
      });

      return {
        created: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      };
    }),
});
