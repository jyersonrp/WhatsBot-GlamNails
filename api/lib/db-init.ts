import path from "node:path";
import fs from "node:fs";
import pg from "pg";
import { getDb, activatePglite, getDbEngine } from "../queries/connection";
import { countUsers } from "../queries/users";
import { seedGlamNails } from "../../db/seed-salon-unas";
import { env } from "./env";

/**
 * Automatically applies pending Drizzle migrations and seeds initial
 * Glam Nails Maturín catalog & admin user on application boot.
 * If external PostgreSQL cannot connect, automatically falls back to embedded local PGlite!
 */
export async function initDatabase(): Promise<{
  success: boolean;
  migrated: boolean;
  seeded: boolean;
  engine: "postgres" | "pglite";
}> {
  const result: {
    success: boolean;
    migrated: boolean;
    seeded: boolean;
    engine: "postgres" | "pglite";
  } = { success: false, migrated: false, seeded: false, engine: "postgres" };

  // 1. Check if external PostgreSQL is reachable if configured
  if (
    env.databaseUrl &&
    !env.databaseUrl.includes("pglite") &&
    !env.databaseUrl.includes("memory") &&
    !env.databaseUrl.includes("local")
  ) {
    try {
      const testPool = new pg.Pool({
        connectionString: env.databaseUrl,
        connectionTimeoutMillis: 2500,
      });
      const client = await testPool.connect();
      client.release();
      await testPool.end().catch(() => {});
      console.log("[Database Init] Successfully connected to external PostgreSQL.");
    } catch (pgErr: unknown) {
      const msg = (pgErr as Error)?.message || String(pgErr);
      console.warn(`[Database Init] Could not connect to external PostgreSQL (${msg}).`);
      console.log("[Database Init] 🚀 Falling back to embedded local PostgreSQL engine (PGlite)...");
      activatePglite();
    }
  } else {
    console.log("[Database Init] Using embedded local PostgreSQL engine (PGlite)...");
    activatePglite();
  }

  const engine = getDbEngine();
  result.engine = engine;
  const db = getDb();
  const migrationsFolder = path.resolve(process.cwd(), "db/migrations");

  try {
    if (fs.existsSync(migrationsFolder)) {
      console.log(`[Database Init] Running pending migrations for ${engine}...`);
      if (engine === "pglite") {
        const { migrate } = await import("drizzle-orm/pglite/migrator");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await migrate(db as any, { migrationsFolder });
      } else {
        const { migrate } = await import("drizzle-orm/node-postgres/migrator");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await migrate(db as any, { migrationsFolder });
      }
      result.migrated = true;
      console.log("[Database Init] Migrations applied successfully.");
    }

    // Check if initial seeding is needed
    const usersCount = await countUsers().catch(() => 0);
    if (usersCount === 0) {
      console.log("[Database Init] Fresh database detected. Seeding Glam Nails Maturín...");
      await seedGlamNails(db);
      result.seeded = true;
      console.log("[Database Init] Seed data and default admin applied successfully.");
    } else {
      console.log(`[Database Init] Database already initialized with ${usersCount} user(s).`);
      // Sync / refresh bot rules priorities and triggers for Glam Nails on existing databases
      try {
        const { botRules } = await import("@db/schema");
        const { eq } = await import("drizzle-orm");
        await db
          .update(botRules)
          .set({
            priority: 90,
            triggerValue:
              "hola, buenos dias, buenas tardes, buenas noches, hey, hi, buenas, saludos, que tal, buen dia, hello",
          })
          .where(eq(botRules.name, "Saludo de bienvenida"));

        await db
          .update(botRules)
          .set({
            priority: 2,
            triggerValue:
              "cancelar cita, cancelar mi cita, cancelar, reprogramar, cambiar cita, mover cita, no podre ir, no puedo ir, postergar, mover fecha, cambiar fecha, anular cita, anulacion",
          })
          .where(eq(botRules.name, "Cancelar o reprogramar cita"));

        await db
          .update(botRules)
          .set({
            priority: 3,
            triggerValue:
              "pago movil, datos de pago, transferencia, comprobante, captura, anticipo, cuenta, banco, como pagar, banesco, pagar, bcv, tasa, tasa bcv, capture, datos bancarios, numero de cuenta, abono, abono de cita",
          })
          .where(eq(botRules.name, "Pago Móvil y anticipo"));

        await db
          .update(botRules)
          .set({
            priority: 4,
            triggerValue:
              "precio, precios, cuanto cuesta, tarifa, tarifas, cuanto vale, costo, costos, presupuesto, cotizacion, cuanto cobran, valor, a como estan, en cuanto sale",
          })
          .where(eq(botRules.name, "Precios"));

        await db
          .update(botRules)
          .set({
            priority: 5,
            triggerValue:
              "agendar, reservar, quiero una cita, sacar cita, apartar, cita para, agendar cita, reservar cita, apartar cupo, quiero cita, hacer una cita, tienen cita, tienen disponible, disponibilidad, tienen turno, turno, quiero turno, agendame",
          })
          .where(eq(botRules.name, "Agendar cita"));

        await db
          .update(botRules)
          .set({
            priority: 6,
            triggerValue:
              "catalogo, servicios, que servicios tienen, menu de servicios, servicios disponibles, acrilico, acrilicas, acrilicos, unas acrilicas, gel, soft gel, kapping, bano de acrilico, semipermanente, esmalte, esmaltado, manicure, manicura, pedicure, pedicura, spa, disenos, esculpidas, unas, sistemas, postizas, que hacen, que ofrecen",
          })
          .where(eq(botRules.name, "Catálogo de servicios"));

        console.log("[Database Init] Bot rules priorities and triggers synchronized successfully.");
      } catch (syncErr: unknown) {
        console.warn("[Database Init] Note: Bot rules sync skipped or not needed:", syncErr);
      }
    }

    result.success = true;
  } catch (error: unknown) {
    const msg = (error as Error)?.message || String(error);
    console.error(`[Database Init] Error running migrations/seed: ${msg}`);
  }

  return result;
}
