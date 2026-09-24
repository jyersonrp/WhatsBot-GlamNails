import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import path from "node:path";
import fs from "node:fs";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

type DbInstance = ReturnType<typeof drizzlePg<typeof fullSchema>>;

let instance: DbInstance | null = null;
let pool: pg.Pool | null = null;
let pgliteInstance: PGlite | null = null;
let dbEngine: "postgres" | "pglite" = "postgres";

export function activatePglite(): DbInstance {
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
  if (!pgliteInstance) {
    const dbDir = path.resolve(process.cwd(), "data/glamnails_db");
    fs.mkdirSync(path.dirname(dbDir), { recursive: true });
    // Remove stale lock file if left over from an abrupt shutdown
    const lockFile = path.join(dbDir, "postmaster.pid");
    if (fs.existsSync(lockFile)) {
      try {
        fs.unlinkSync(lockFile);
      } catch {
        // ignore if not removable
      }
    }
    pgliteInstance = new PGlite(dbDir);
    instance = drizzlePglite(pgliteInstance, {
      schema: fullSchema,
    }) as unknown as DbInstance;
    dbEngine = "pglite";
  }
  return instance!;
}

export function getDb(): DbInstance {
  if (!instance) {
    if (
      env.databaseUrl &&
      !env.databaseUrl.includes("memory") &&
      !env.databaseUrl.includes("pglite") &&
      !env.databaseUrl.includes("local")
    ) {
      pool = new pg.Pool({
        connectionString: env.databaseUrl,
      });
      instance = drizzlePg(pool, {
        schema: fullSchema,
      });
      dbEngine = "postgres";
    } else {
      activatePglite();
    }
  }
  return instance!;
}

export function getDbEngine(): "postgres" | "pglite" {
  return dbEngine;
}

export function getPool(): pg.Pool | null {
  if (!pool && dbEngine === "postgres") {
    getDb();
  }
  return pool;
}
