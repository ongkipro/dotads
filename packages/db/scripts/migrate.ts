import { migrate } from "drizzle-orm/postgres-js/migrator";
import { migrationDb, migrationClient } from "../src/client.ts";
import * as dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function runMigrations() {
  if (process.env.NODE_ENV === "production" && !process.env.MIGRATION_DATABASE_URL) {
    throw new Error("MIGRATION_DATABASE_URL is required for production migrations");
  }
  console.log("Running Drizzle migrations against PostgreSQL...");
  const migrationsFolder = path.resolve(__dirname, "../drizzle/migrations");
  
  await migrate(migrationDb, { migrationsFolder });
  console.log("Migrations successfully applied!");
  await migrationClient.end();
}

runMigrations().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Migration failed:", msg);
  process.exit(1);
});
