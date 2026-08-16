import { app, resolveCorsOrigin } from "../src/app.ts";
import { buildTrustedOrigins } from "@dotads/auth";
import { db, schema, withDatabaseContext, type DatabaseSessionContext } from "@dotads/db";
import { and, count, eq } from "drizzle-orm";
import assert from "node:assert";
import { randomUUID } from "node:crypto";

async function runPublicAuthSmoke() {
  console.log("Starting Public Authentication & Gate Hardening Smoke Test...");

  // 1. GET /api/auth/get-session (Verify Better Auth handler is mounted)
  const getSessionRes = await app.request("/api/auth/get-session", { method: "GET" });
  assert.strictEqual(getSessionRes.status, 200, "Better Auth get-session route must return 200");
  assert.strictEqual(resolveCorsOrigin("https://attacker.invalid"), undefined, "Unknown CORS origins must be denied");
  assert.deepStrictEqual(
    buildTrustedOrigins(["http://100.127.67.86:3100"], "development").includes("http://localhost:3100"),
    true,
    "Development origins must merge localhost with explicitly configured Tailscale origins"
  );
  assert.deepStrictEqual(
    buildTrustedOrigins(["https://admin.example.com"], "production"),
    ["https://admin.example.com"],
    "Production origins must remain configured-only"
  );

  // 2. POST /api/v1/public/auth/register-merchant (Atomic Merchant Onboarding)
  const uniqueStoreSlug = `smoke-store-${Date.now()}`;
  const uniqueEmail = `owner-${Date.now()}@test.com`;

  const regRes = await app.request("/api/v1/public/auth/register-merchant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      storeName: "Smoke Merchant Store",
      storeSlug: uniqueStoreSlug,
      ownerName: "Smoke Store Owner",
      email: uniqueEmail,
      password: "SecurePassword123!",
    }),
  });

  assert.strictEqual(regRes.status, 201, "Merchant registration must return 201 Created");
  const regData = await regRes.json();
  assert.equal("token" in regData, false, "Registration must never expose the raw session token");
  assert.ok(regData.tenant?.id, "Response must include provisioned tenant ID");
  assert.strictEqual(regData.tenant?.slug, uniqueStoreSlug, "Tenant slug must match requested slug");
  assert.strictEqual(regData.user?.role, "TENANT_OWNER", "Provisioned user role must be TENANT_OWNER");
  const tenantContext: DatabaseSessionContext = {
    userId: regData.user.id,
    userEmail: regData.user.email,
    tenantId: regData.tenant.id,
    organizationId: regData.organization.id,
    role: "TENANT_OWNER",
    tenantName: regData.tenant.name,
    tenantStatus: regData.tenant.status,
  };

  // The authenticated owner can operate while active and is denied immediately after suspension.
  let sessionCookie = regRes.headers.get("set-cookie")?.split(";")[0];
  assert.ok(sessionCookie, "Registration must establish a session cookie");
  const sessionContextResponse = await app.request("/api/v1/session", {
    headers: { cookie: sessionCookie },
  });
  assert.strictEqual(sessionContextResponse.status, 200, "Session context endpoint must authenticate the owner");
  const sessionContextData = await sessionContextResponse.json();
  assert.deepStrictEqual(sessionContextData, {
    userId: regData.user.id,
    userEmail: regData.user.email,
    tenantId: regData.tenant.id,
    organizationId: regData.organization.id,
    role: "TENANT_OWNER",
    tenantName: regData.tenant.name,
    tenantStatus: "active",
  });
  const activeTenantRequest = await app.request("/api/v1/admin/members", {
    headers: { cookie: sessionCookie },
  });
  assert.strictEqual(activeTenantRequest.status, 200, "Active tenant owner must be allowed");

  // Better Auth email sign-in creates a fresh session without activeOrganizationId.
  const signOutResponse = await app.request("/api/auth/sign-out", {
    method: "POST",
    headers: {
      cookie: sessionCookie,
      "content-type": "application/json",
      origin: "http://localhost:3100",
    },
    body: "{}",
  });
  assert.strictEqual(signOutResponse.status, 200, "Merchant logout must succeed");
  assert.match(signOutResponse.headers.get("set-cookie") || "", /Max-Age=0/i, "Logout must expire the browser cookie");
  const revokedBetterAuthSession = await app.request("/api/auth/get-session", {
    headers: { cookie: sessionCookie },
  });
  assert.strictEqual(await revokedBetterAuthSession.json(), null, "Logout must revoke the server-side session");
  const revokedSessionContext = await app.request("/api/v1/session", {
    headers: { cookie: sessionCookie },
  });
  assert.strictEqual(revokedSessionContext.status, 401, "A stale cookie must be treated as unauthenticated");
  const revokedAdminRoute = await app.request("/api/v1/admin/members", {
    headers: { cookie: sessionCookie },
  });
  assert.strictEqual(revokedAdminRoute.status, 401, "A stale cookie must not reach tenant admin data");
  await withDatabaseContext(tenantContext, () => db
    .update(schema.members)
    .set({ role: "END_BUYER" })
    .where(and(
      eq(schema.members.organizationId, regData.organization.id),
      eq(schema.members.userId, regData.user.id)
    )));
  const buyerOnlySignIn = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3100" },
    body: JSON.stringify({ email: uniqueEmail, password: "SecurePassword123!" }),
  });
  const buyerOnlyCookie = buyerOnlySignIn.headers.get("set-cookie")?.split(";")[0];
  assert.ok(buyerOnlyCookie);
  const buyerCmsSession = await app.request("/api/v1/session", { headers: { cookie: buyerOnlyCookie } });
  assert.strictEqual(buyerCmsSession.status, 403, "Buyer-only membership must not resolve a CMS session");
  const buyerWorkspaceList = await app.request("/api/v1/workspaces", { headers: { cookie: buyerOnlyCookie } });
  assert.deepStrictEqual(await buyerWorkspaceList.json(), { workspaces: [] }, "Buyer memberships must not be offered as CMS workspaces");
  await withDatabaseContext(tenantContext, () => db
    .update(schema.members)
    .set({ role: "TENANT_OWNER" })
    .where(and(
      eq(schema.members.organizationId, regData.organization.id),
      eq(schema.members.userId, regData.user.id)
    )));
  const signInResponse = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3100" },
    body: JSON.stringify({ email: uniqueEmail, password: "SecurePassword123!" }),
  });
  assert.strictEqual(signInResponse.status, 200, "Merchant email re-login must succeed");
  const reLoginCookie = signInResponse.headers.get("set-cookie")?.split(";")[0];
  assert.ok(reLoginCookie, "Merchant re-login must establish a session cookie");
  sessionCookie = reLoginCookie;

  const reLoginSessionResponse = await app.request("/api/v1/session", {
    headers: { cookie: reLoginCookie },
  });
  assert.strictEqual(reLoginSessionResponse.status, 200, "Single-workspace re-login must restore tenant context");
  assert.deepStrictEqual(await reLoginSessionResponse.json(), sessionContextData);
  const persistedReLoginSession = await app.request("/api/auth/get-session", {
    headers: { cookie: reLoginCookie },
  });
  assert.strictEqual(
    (await persistedReLoginSession.json()).session.activeOrganizationId,
    regData.organization.id,
    "Resolved single workspace must persist on the authenticated Better Auth session"
  );
  const reLoginAdminResponse = await app.request("/api/v1/admin/members", {
    headers: { cookie: reLoginCookie },
  });
  assert.strictEqual(reLoginAdminResponse.status, 200, "Re-logged-in tenant owner must reach admin routes");

  const secondOrganizationId = randomUUID();
  await withDatabaseContext(tenantContext, async () => {
    await db.insert(schema.organizations).values({
      id: secondOrganizationId,
      tenantId: regData.tenant.id,
      name: "Second Smoke Workspace",
      slug: `second-${uniqueStoreSlug}`,
    });
    await db.insert(schema.members).values({
      id: randomUUID(),
      organizationId: secondOrganizationId,
      userId: regData.user.id,
      role: "ADMIN",
    });
  });

  const multiSignInResponse = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: uniqueEmail, password: "SecurePassword123!" }),
  });
  assert.strictEqual(multiSignInResponse.status, 200);
  const multiWorkspaceCookie = multiSignInResponse.headers.get("set-cookie")?.split(";")[0];
  assert.ok(multiWorkspaceCookie);
  const multiWorkspaceSession = await app.request("/api/v1/session", {
    headers: { cookie: multiWorkspaceCookie },
  });
  assert.strictEqual(multiWorkspaceSession.status, 409, "Multiple workspaces must never be selected arbitrarily");
  assert.deepStrictEqual(await multiWorkspaceSession.json(), {
    error: "Workspace selection required",
    code: "WORKSPACE_SELECTION_REQUIRED",
    workspaceSelectionRequired: true,
  });
  const unresolvedMultiWorkspaceSession = await app.request("/api/auth/get-session", {
    headers: { cookie: multiWorkspaceCookie },
  });
  assert.strictEqual(
    (await unresolvedMultiWorkspaceSession.json()).session.activeOrganizationId,
    null,
    "Ambiguous workspace resolution must not mutate the session"
  );
  const workspaceListResponse = await app.request("/api/v1/workspaces", {
    headers: { cookie: multiWorkspaceCookie },
  });
  assert.strictEqual(workspaceListResponse.status, 200, "Ambiguous sessions must be able to list their own workspaces");
  const workspaceList = (await workspaceListResponse.json()).workspaces;
  assert.deepStrictEqual(
    workspaceList.map((workspace: { organizationId: string }) => workspace.organizationId).sort(),
    [regData.organization.id, secondOrganizationId].sort(),
    "Workspace choices must contain only the authenticated user's memberships"
  );
  assert.deepStrictEqual(
    workspaceList
      .map((workspace: { organizationName: string }) => workspace.organizationName)
      .sort(),
    [regData.organization.name, "Second Smoke Workspace"].sort(),
    "Workspace choices must distinguish organizations within the same tenant"
  );
  const forgedWorkspaceSelection = await app.request("/api/v1/workspaces/select", {
    method: "POST",
    headers: { cookie: multiWorkspaceCookie, "content-type": "application/json" },
    body: JSON.stringify({ organizationId: randomUUID() }),
  });
  assert.strictEqual(forgedWorkspaceSelection.status, 403, "A forged workspace selection must be denied");
  const workspaceSelection = await app.request("/api/v1/workspaces/select", {
    method: "POST",
    headers: { cookie: multiWorkspaceCookie, "content-type": "application/json" },
    body: JSON.stringify({ organizationId: secondOrganizationId }),
  });
  assert.strictEqual(workspaceSelection.status, 200, "An owned active workspace must be selectable");
  assert.deepStrictEqual(await workspaceSelection.json(), {
    userId: regData.user.id,
    userEmail: regData.user.email,
    tenantId: regData.tenant.id,
    organizationId: secondOrganizationId,
    role: "ADMIN",
    tenantName: regData.tenant.name,
    tenantStatus: "active",
  });
  const selectedWorkspaceSession = await app.request("/api/v1/session", {
    headers: { cookie: multiWorkspaceCookie },
  });
  assert.strictEqual(selectedWorkspaceSession.status, 200, "Selected workspace must restore the canonical session route");
  assert.strictEqual((await selectedWorkspaceSession.json()).organizationId, secondOrganizationId);

  await withDatabaseContext(tenantContext, () => db
    .delete(schema.organizations)
    .where(eq(schema.organizations.id, secondOrganizationId)));

  const invitationResponse = await app.request("/api/v1/admin/members/invite", {
    method: "POST",
    headers: { cookie: sessionCookie, "content-type": "application/json" },
    body: JSON.stringify({ email: `staff-${Date.now()}@test.com`, role: "ADMIN" }),
  });
  assert.strictEqual(invitationResponse.status, 201, "Tenant owner member invitation must reach the real handler");

  await withDatabaseContext(tenantContext, () => db
    .update(schema.members)
    .set({ role: "ADVERTISER" })
    .where(
      and(
        eq(schema.members.organizationId, regData.organization.id),
        eq(schema.members.userId, regData.user.id)
      )
    ));
  const formSlug = `advertiser-form-${Date.now()}`;
  const advertiserFormResponse = await app.request("/api/v1/admin/forms", {
    method: "POST",
    headers: { cookie: sessionCookie, "content-type": "application/json" },
    body: JSON.stringify({
      title: "Advertiser Smoke Form",
      slug: formSlug,
      mode: "hybrid",
      schemaJson: {
        title: "Advertiser Smoke Form",
        mode: "hybrid",
        fields: [],
        submitButtonText: "Kirim",
        paymentMethods: ["COD"],
      },
    }),
  });
  assert.strictEqual(advertiserFormResponse.status, 201, "Advertiser builder mutation must reach the real handler");
  await withDatabaseContext(tenantContext, () => db
    .update(schema.members)
    .set({ role: "TENANT_OWNER" })
    .where(
      and(
        eq(schema.members.organizationId, regData.organization.id),
        eq(schema.members.userId, regData.user.id)
      )
    ));

  const mutationAudits = await withDatabaseContext(tenantContext, () => db
    .select({ action: schema.auditLogs.action })
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.tenantId, regData.tenant.id)));
  assert.ok(mutationAudits.some((entry) => entry.action === "member.invite"), "Invitation must be audited");
  assert.ok(mutationAudits.some((entry) => entry.action === "form.create"), "Builder mutation must be audited");

  const platformHeaders = {
    "x-session-token": "test-superadmin-token",
    "x-user-role": "SUPER_ADMIN",
    "content-type": "application/json",
  };
  const suspendResponse = await app.request(`/api/v1/platform/tenants/${regData.tenant.id}/status`, {
    method: "PATCH",
    headers: platformHeaders,
    body: JSON.stringify({ status: "suspended", reason: "Tenant suspension access-control smoke" }),
  });
  assert.strictEqual(suspendResponse.status, 200, "Smoke setup must suspend the tenant");

  const suspendedTenantRequest = await app.request("/api/v1/admin/members", {
    headers: { cookie: sessionCookie },
  });
  assert.strictEqual(suspendedTenantRequest.status, 403, "Suspended tenant session must be denied");

  const assertInactivePublicIngress = async (status: "suspended" | "cancelled") => {
    const [{ orderCountBefore }] = await withDatabaseContext(tenantContext, () => db
      .select({ orderCountBefore: count() }).from(schema.orders));
    const [{ leadCountBefore }] = await withDatabaseContext(tenantContext, () => db
      .select({ leadCountBefore: count() }).from(schema.draftLeads));
    const originalFetch = globalThis.fetch;
    const previousNodeEnv = process.env.NODE_ENV;
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls += 1;
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    };
    process.env.NODE_ENV = "development";
    try {
      const requests = await Promise.all([
        app.request("/api/v1/public/shipping/rates", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ tenantId: regData.tenant.id, subdistrictId: "ID_SUB_1001", weightGrams: 1000 }),
        }),
        app.request("/api/v1/public/leads/draft", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ tenantId: regData.tenant.id, customerName: "Blocked Lead", customerPhone: "081234567890" }),
        }),
        app.request("/api/v1/public/orders", {
          method: "POST", headers: { "content-type": "application/json", "Idempotency-Key": randomUUID() },
          body: JSON.stringify({
            tenantId: regData.tenant.id,
            customerName: "Blocked Buyer",
            customerPhone: "081234567890",
            shippingAddress: "Jl. Blocked Storefront No. 1",
            subdistrictId: "ID_SUB_1001",
            items: [{ productId: randomUUID(), quantity: 1 }],
          }),
        }),
      ]);
      assert.deepEqual(requests.map((response) => response.status), [404, 404, 404], `${status} storefront ingress must be hidden`);
      assert.equal(providerCalls, 0, `${status} storefront must be rejected before provider calls`);
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      globalThis.fetch = originalFetch;
    }
    const [{ orderCountAfter }] = await withDatabaseContext(tenantContext, () => db
      .select({ orderCountAfter: count() }).from(schema.orders));
    const [{ leadCountAfter }] = await withDatabaseContext(tenantContext, () => db
      .select({ leadCountAfter: count() }).from(schema.draftLeads));
    assert.equal(orderCountAfter, orderCountBefore, `${status} storefront must not persist orders`);
    assert.equal(leadCountAfter, leadCountBefore, `${status} storefront must not persist leads`);
  };

  await assertInactivePublicIngress("suspended");

  const cancelResponse = await app.request(`/api/v1/platform/tenants/${regData.tenant.id}/status`, {
    method: "PATCH",
    headers: platformHeaders,
    body: JSON.stringify({ status: "cancelled", reason: "Cancelled storefront ingress smoke" }),
  });
  assert.strictEqual(cancelResponse.status, 200, "Smoke setup must cancel the tenant");
  await assertInactivePublicIngress("cancelled");

  const reactivateResponse = await app.request(`/api/v1/platform/tenants/${regData.tenant.id}/status`, {
    method: "PATCH",
    headers: platformHeaders,
    body: JSON.stringify({ status: "active", reason: "Restore tenant after access-control smoke" }),
  });
  assert.strictEqual(reactivateResponse.status, 200, "Smoke cleanup must reactivate the tenant");

  // 3. Test Duplicate Registration Collision (409 Conflict)
  const dupRes = await app.request("/api/v1/public/auth/register-merchant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      storeName: "Smoke Merchant Store Duplicate",
      storeSlug: uniqueStoreSlug, // Duplicate slug
      ownerName: "Smoke Store Owner",
      email: uniqueEmail, // Duplicate email
      password: "SecurePassword123!",
    }),
  });
  assert.strictEqual(dupRes.status, 409, "Duplicate registration must return 409 Conflict");

  // 4. Test Super Admin Bootstrap Route
  const bootstrapRes = await app.request("/api/v1/public/auth/bootstrap-superadmin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Root Platform Super Admin",
      email: `superadmin-${Date.now()}@dotads.com`,
      password: "SuperAdminPassword123!",
    }),
  });

  assert.strictEqual(bootstrapRes.status, 403, "HTTP Super Admin bootstrap must have no database-capable path");
  assert.deepStrictEqual(await bootstrapRes.json(), { error: "HTTP bootstrap disabled; use the operator CLI" });

  // 5. Gate Hardening Test: Verify test token is blocked in non-test mode
  const origEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const bypassRes = await app.request("/api/v1/platform/tenants", {
      method: "GET",
      headers: { "Authorization": "Bearer test-superadmin-token" },
    });
    assert.strictEqual(bypassRes.status, 401, "Bypass token must be rejected in production environment");

    const productionBootstrap = await app.request("/api/v1/public/auth/bootstrap-superadmin", {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": randomUUID() },
      body: JSON.stringify({ name: "Blocked", email: "blocked@example.com", password: "BlockedPassword123!" }),
    });
    assert.strictEqual(productionBootstrap.status, 404, "HTTP Super Admin bootstrap must not exist in production");
    assert.deepStrictEqual(await productionBootstrap.json(), { error: "Not Found" });

    const orderWithoutTurnstileRes = await app.request("/api/v1/public/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": randomUUID() },
      body: JSON.stringify({
        tenantId: "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8",
        customerName: "Bot Attempt",
        customerPhone: "081234567890",
        shippingAddress: "Jl. Testing No. 1",
        subdistrictId: "test-subdistrict",
        items: [{ productId: "2f2ca823-46bf-4ab5-a5fe-61a49d175fa8", quantity: 1 }],
      }),
    });
    assert.strictEqual(
      orderWithoutTurnstileRes.status,
      403,
      "Production order intake must fail closed when Turnstile is not configured"
    );
  } finally {
    process.env.NODE_ENV = origEnv;
  }

  console.log("PUBLIC AUTH & GATE HARDENING SMOKE TEST PASSED!");
  process.exit(0);
}

runPublicAuthSmoke().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Public Auth Smoke FAILED:", msg);
  process.exit(1);
});
