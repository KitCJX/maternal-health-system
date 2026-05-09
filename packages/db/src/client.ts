import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// `postgres` is the low-level PostgreSQL client
// `drizzle` wraps it with our schema to provide type-safe queries
const sql = postgres(connectionString);
export const db = drizzle(sql, { schema });

export type Database = typeof db;
