import { z } from "zod";

export const RoleEnum = z.enum([
  "SUPER_ADMIN",
  "TENANT_OWNER",
  "ADMIN",
  "ADVERTISER",
  "CUSTOMER_SERVICE",
  "END_BUYER",
]);

export type Role = z.infer<typeof RoleEnum>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
});

export const OrganizationSchema = z.object({
  id: z.string(),
  tenantId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable().optional(),
});

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: RoleEnum,
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: RoleEnum.default("ADMIN"),
});
