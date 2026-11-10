import "server-only";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { isLocalPreviewConfigured } from "@/lib/local-preview";

export type Database = PostgresJsDatabase<typeof schema>;

declare global {
  var jarvisDatabase: Database | undefined;
  var jarvisDatabasePromise: Promise<Database> | undefined;
  var jarvisSqlClient: ReturnType<typeof postgres> | undefined;
}

async function createDatabase(): Promise<Database> {
  if (globalThis.jarvisDatabase) return globalThis.jarvisDatabase;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (!isLocalPreviewConfigured()) {
      throw new Error("DATABASE_URL is required outside Jarvis local preview mode.");
    }

    const localStateDirectory = path.join(process.cwd(), ".jarvis");
    await mkdir(localStateDirectory, { recursive: true });
    const client = new PGlite(path.join(localStateDirectory, "pglite"));
    const localDatabase = drizzlePglite(client, { schema });
    await migratePglite(localDatabase, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    const database = localDatabase as unknown as Database;
    globalThis.jarvisDatabase = database;
    return database;
  }

  const sql = globalThis.jarvisSqlClient ?? postgres(databaseUrl, { prepare: false });
  const database = drizzle(sql, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalThis.jarvisSqlClient = sql;
    globalThis.jarvisDatabase = database;
  }

  return database;
}

export function getDatabase(): Promise<Database> {
  if (globalThis.jarvisDatabase) return Promise.resolve(globalThis.jarvisDatabase);
  globalThis.jarvisDatabasePromise ??= createDatabase().catch((error) => {
    globalThis.jarvisDatabasePromise = undefined;
    throw error;
  });
  return globalThis.jarvisDatabasePromise;
}
