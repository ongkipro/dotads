import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.ts";

const connectionString =
  process.env.DATABASE_URL || "postgres://dotads_user:dotads_password@localhost:5432/dotads_db";

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export function withTenantGuard<T extends { tenantId: string }>(
  data: T,
  expectedTenantId: string
): T {
  if (data.tenantId !== expectedTenantId) {
    throw new Error(
      `Tenant Isolation Violation: Data tenantId (${data.tenantId}) does not match expected tenantId (${expectedTenantId})`
    );
  }
  return data;
}
