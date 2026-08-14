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

const passwordSchema = z.string().min(8).max(128);

export const registerMerchantSchema = z.object({
  storeName: z.string().trim().min(1).max(255),
  storeSlug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Store slug must contain lowercase letters, numbers, and single hyphens only"),
  ownerName: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  password: passwordSchema,
});

export const bootstrapSuperAdminSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  password: passwordSchema,
});
