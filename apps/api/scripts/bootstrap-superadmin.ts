import { hashPassword } from "better-auth/crypto";
import postgres from "postgres";
import { z } from "zod";

const InputSchema = z.object({
  migrationDatabaseUrl: z.string().min(1),
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  operatorEmail: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
}).strict();

async function run() {
  const input = InputSchema.parse({
    migrationDatabaseUrl: process.env.MIGRATION_DATABASE_URL,
    name: process.env.DOTADS_BOOTSTRAP_NAME,
    email: process.env.DOTADS_BOOTSTRAP_EMAIL,
    password: process.env.DOTADS_BOOTSTRAP_PASSWORD,
    operatorEmail: process.env.DOTADS_BOOTSTRAP_OPERATOR_EMAIL,
  });
  const passwordHash = await hashPassword(input.password);
  const sql = postgres(input.migrationDatabaseUrl, {
    max: 1,
    connection: { application_name: "dotads-bootstrap-superadmin", TimeZone: "UTC" },
  });

  try {
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext('dotads.bootstrap-super-admin'))`;
      const existing = await tx`select id from users where role = 'SUPER_ADMIN' limit 1`;
      if (existing.length > 0) throw new Error("SUPER_ADMIN_EXISTS");

      const userId = crypto.randomUUID();
      await tx`
        insert into users (id, name, email, email_verified, role)
        values (${userId}, ${input.name}, ${input.email}, true, 'SUPER_ADMIN')
      `;
      await tx`
        insert into accounts (id, account_id, provider_id, user_id, password)
        values (${crypto.randomUUID()}, ${userId}, 'credential', ${userId}, ${passwordHash})
      `;
      await tx`
        insert into audit_logs (
          tenant_id, actor_id, actor_email, actor_role, action,
          target_type, target_id, metadata_json
        ) values (
          null, 'operator:bootstrap-cli', ${input.operatorEmail}, 'SYSTEM_OPERATOR',
          'platform.super_admin_bootstrapped', 'user', ${userId},
          ${tx.json({ source: "operator_cli" })}
        )
      `;
    });
  } finally {
    await sql.end();
  }

  console.log("Super Admin bootstrap completed; sign in through the standard authentication endpoint");
}

run().catch((error: unknown) => {
  const message = error instanceof Error && error.message === "SUPER_ADMIN_EXISTS"
    ? "Super Admin bootstrap refused: a Super Admin already exists"
    : "Super Admin bootstrap failed; verify operator inputs and migration database access";
  console.error(message);
  process.exitCode = 1;
});
