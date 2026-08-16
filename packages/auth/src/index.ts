import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db, schema } from "@dotads/db";

const authSecret = process.env.BETTER_AUTH_SECRET;

if (process.env.NODE_ENV === "production" && !authSecret) {
  throw new Error("BETTER_AUTH_SECRET is required in production");
}

const configuredTrustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) || [];

const developmentTrustedOrigins = [
  "http://localhost:3000",
  "http://localhost:3100",
  "http://localhost:4321",
  "http://localhost:8787",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3100",
  "http://127.0.0.1:4321",
  "http://127.0.0.1:8787",
];

export function buildTrustedOrigins(configured: string[], nodeEnv: string | undefined): string[] {
  return [...new Set(nodeEnv === "production" ? configured : [...developmentTrustedOrigins, ...configured])];
}

const trustedOrigins = buildTrustedOrigins(configuredTrustedOrigins, process.env.NODE_ENV);

export function isTrustedAuthOrigin(origin: string): boolean {
  return trustedOrigins.includes(origin);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Local development may use the explicit admin/admin convenience account.
    // Production keeps the stronger boundary and never accepts that credential.
    minPasswordLength: process.env.NODE_ENV === "production" ? 8 : 4,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "END_BUYER",
        required: false,
        input: false,
      },
    },
  },
  secret: authSecret || "dotads-dev-super-secret-key-32-chars-min!",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8787",
  trustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 120,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/change-password": { window: 60, max: 5 },
    },
  },
  plugins: [
    organization({
      // Tenant organizations are created atomically by the merchant provisioning flow.
      allowUserToCreateOrganization: false,
    }),
  ],
});

export type Role = "SUPER_ADMIN" | "TENANT_OWNER" | "ADMIN" | "ADVERTISER" | "CUSTOMER_SERVICE" | "END_BUYER";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  TENANT_OWNER: [
    "tenant:*",
    "members:*",
    "catalog:*",
    "orders:*",
    "settings:*",
    "builders:*",
    "tracking:*",
    "billing:*",
  ],
  ADMIN: [
    "tenant:read",
    "members:read",
    "catalog:*",
    "orders:read",
    "orders:create",
    "orders:update",
    "settings:*",
    "builders:*",
    "tracking:*",
  ],
  ADVERTISER: [
    "catalog:read",
    "builders:*",
    "tracking:*",
  ],
  CUSTOMER_SERVICE: [
    "orders:read",
    "orders:create",
    "orders:update",
    "catalog:read",
    "members:read",
  ],
  END_BUYER: [
    "storefront:read",
    "orders:create",
  ],
};

export function hasPermission(role: Role, requiredPermission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;

  const [domain] = requiredPermission.split(":");
  return perms.includes(requiredPermission) || perms.includes(`${domain}:*`);
}
