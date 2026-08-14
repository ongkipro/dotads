import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db, schema } from "@dotads/db";

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
  secret: process.env.BETTER_AUTH_SECRET || "dotads-dev-super-secret-key-32-chars-min!",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8787",
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
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
    "orders:*",
    "settings:*",
    "builders:*",
    "tracking:*",
  ],
  ADVERTISER: [
    "catalog:read",
    "builders:*",
    "tracking:*",
    "orders:read",
  ],
  CUSTOMER_SERVICE: [
    "orders:*",
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
