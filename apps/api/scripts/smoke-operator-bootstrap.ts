import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import postgres from "postgres";

const execFileAsync = promisify(execFile);
const migrationDatabaseUrl = process.env.MIGRATION_DATABASE_URL;
assert.ok(migrationDatabaseUrl, "MIGRATION_DATABASE_URL is required");

const sql = postgres(migrationDatabaseUrl, { max: 1 });
const suffix = `${Date.now()}-${process.pid}`;
const email = `bootstrap-${suffix}@operator-smoke.invalid`;
const password = `Ephemeral-${suffix}-Password!`;
const operatorEmail = `operator-${suffix}@operator-smoke.invalid`;

async function invoke(candidateEmail: string, candidatePassword: string) {
  try {
    const result = await execFileAsync(process.execPath, [
      "--experimental-strip-types",
      "scripts/bootstrap-superadmin.ts",
    ], {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        MIGRATION_DATABASE_URL: migrationDatabaseUrl,
        DOTADS_BOOTSTRAP_NAME: "Ephemeral Bootstrap Admin",
        DOTADS_BOOTSTRAP_EMAIL: candidateEmail,
        DOTADS_BOOTSTRAP_PASSWORD: candidatePassword,
        DOTADS_BOOTSTRAP_OPERATOR_EMAIL: operatorEmail,
      },
    });
    return { ok: true as const, stdout: result.stdout, stderr: result.stderr };
  } catch (error: any) {
    return {
      ok: false as const,
      stdout: String(error.stdout ?? ""),
      stderr: String(error.stderr ?? ""),
    };
  }
}

async function run() {
  const originalSupers = await sql<{ id: string }[]>`select id from users where role = 'SUPER_ADMIN'`;
  try {
    await sql`update users set role = 'END_BUYER' where role = 'SUPER_ADMIN'`;

    const first = await invoke(email, password);
    assert.equal(first.ok, true, "Operator CLI must bootstrap the first Super Admin");
    assert.doesNotMatch(first.stdout + first.stderr, new RegExp(email.replace(".", "\\."), "i"));
    assert.doesNotMatch(first.stdout + first.stderr, new RegExp(password.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    const [created] = await sql<{ id: string; role: string; password: string }[]>`
      select u.id, u.role, a.password
      from users u join accounts a on a.user_id = u.id and a.provider_id = 'credential'
      where lower(u.email) = lower(${email})
    `;
    assert.equal(created?.role, "SUPER_ADMIN");
    assert.ok(created?.password && created.password !== password, "Credential must be hashed");

    const [audit] = await sql<{ actor_id: string; actor_email: string; actor_role: string; action: string }[]>`
      select actor_id, actor_email, actor_role, action from audit_logs
      where target_id = ${created.id} and action = 'platform.super_admin_bootstrapped'
    `;
    assert.deepEqual(audit, {
      actor_id: "operator:bootstrap-cli",
      actor_email: operatorEmail,
      actor_role: "SYSTEM_OPERATOR",
      action: "platform.super_admin_bootstrapped",
    });

    const secondEmail = `second-${email}`;
    const secondPassword = `${password}-second`;
    const second = await invoke(secondEmail, secondPassword);
    assert.equal(second.ok, false, "Operator CLI must atomically refuse a second Super Admin");
    assert.match(second.stderr, /already exists/i);
    assert.doesNotMatch(second.stdout + second.stderr, new RegExp(secondEmail.replace(".", "\\."), "i"));
    assert.doesNotMatch(second.stdout + second.stderr, new RegExp(secondPassword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } finally {
    await sql`delete from users where email = ${email}`;
    for (const { id } of originalSupers) {
      await sql`update users set role = 'SUPER_ADMIN' where id = ${id}`;
    }
    await sql.end();
  }

  console.log("Operator Super Admin bootstrap smoke passed");
}

await run();
