# Super Admin Architecture & Platform Control Plane Specification
**DotAds Engine v2 - Multi-Tenant Platform Administration Specification**

---

## 1. Architecture Overview & Control Plane Boundary

DotAds Engine v2 employs a strict **Role-Based Isolation & Multi-Tenant Control Plane Architecture**. The **Super Admin Workspace** (`/super-admin`) operates at the platform level, separated from individual merchant workspaces (`/admin`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SUPER ADMIN CONTROL PLANE HUB                        │
│             Role: SUPER_ADMIN (Platform Operator Scope)                 │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ /super-admin      │ /super-admin      │ /super-admin/settings          │
│ Platform Metrics  │ Tenant Fleet      │ Global Registry                │
└─────────┬─────────┴─────────┬─────────┴───────────────┬────────────────┘
          │                   │                         │
          ▼                   ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   HONO PLATFORM ROUTER (/api/platform/*)               │
├────────────────────────────────────────────────────────────────────────┤
│ GET  /platform/stats           - Aggregate GMV & Fleet Metrics         │
│ GET  /platform/tenants         - List & Search Tenant Fleet            │
│ POST /platform/tenants         - Provision New Merchant Workspace      │
│ PATCH/platform/tenants/:id     - Suspend/Activate & Tier Mutation     │
│ POST /platform/tenants/:id/imp - Secure Tenant Impersonation Token    │
│ GET  /platform/settings        - Global Platform Defaults Registry     │
│ PUT  /platform/settings        - Mutate Global Security/Tenancy Config │
│ GET  /platform/audit-logs      - Immutable Platform-wide Audit Trail   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Contract Specification (@hono/zod-openapi)

### 2.1 Fleet Statistics Endpoint
* **Path:** `GET /api/platform/stats`
* **Permission:** `SUPER_ADMIN`
* **Response Schema:**
```json
{
  "totalTenants": 4,
  "activeTenants": 3,
  "suspendedTenants": 1,
  "totalGmv": 184200000,
  "totalOrders": 1445,
  "securityAlertsCount": 1,
  "planBreakdown": {
    "STARTER": 2,
    "PRO": 1,
    "ENTERPRISE": 1
  }
}
```

### 2.2 Provisioning Endpoint
* **Path:** `POST /api/platform/tenants`
* **Permission:** `SUPER_ADMIN`
* **Request Schema:**
```json
{
  "name": "Beta Gadget Store",
  "slug": "beta-gadget",
  "ownerEmail": "owner@betagadget.com",
  "customDomain": "betagadget.com",
  "tier": "PRO"
}
```

### 2.3 Tenant Impersonation Endpoint
* **Path:** `POST /api/platform/tenants/:id/impersonate`
* **Permission:** `SUPER_ADMIN`
* **Response:** Signed bearer JWT token scoping session to `tenantId` with `impersonatedBy: "superadmin_id"`.

---

## 3. Security & Immutable Audit Logging Invariant
Every action executed by a Super Admin MUST create an append-only entry in `schema.auditLogs`:
1. `TENANT_PROVISIONED`: When a new merchant workspace is initialized.
2. `TENANT_STATUS_MUTATED`: When a tenant is suspended or activated.
3. `TENANT_IMPERSONATED`: When an operator enters a merchant workspace.
4. `PLATFORM_SETTING_MUTATED`: When global TTL, MFA, or rate limit defaults are updated.

---

## 4. Implementation Task Matrix

| Task ID | Component | Deliverable | Status |
| :--- | :--- | :--- | :--- |
| `SA-01` | Specification | `SUPER_ADMIN_ARCHITECTURE.md` PRD & contract definition | Completed |
| `SA-02` | Hono API Router | Full CRUD OpenAPI handlers in `apps/api/src/routes/platform.ts` | Completed |
| `SA-03` | Fleet Management UI | Interactive provisioning modal, status toggling, and search | Completed |
| `SA-04` | Global Settings UI | Platform settings mutation with audit warning & preview | Completed |
| `SA-05` | Global Audit Logs UI | Filterable audit event inspector & CSV/JSON exporter | Completed |
| `SA-06` | Integration Smoke | `smoke-platform.ts` automated end-to-end verification | Completed |
