import { z } from "zod";

/** Validates GS1 GTIN-8, UPC-12, EAN-13, or GTIN-14 with modulo-10 checksum. */
export function validateGtinChecksum(gtin: string): boolean {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(gtin)) return false;
  const digits = gtin.split("").map(Number);
  const checkDigit = digits.pop()!;
  const sum = digits.reverse().reduce(
    (total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1),
    0
  );
  return (10 - (sum % 10)) % 10 === checkDigit;
}

export const GtinSchema = z.string().refine(validateGtinChecksum, {
  message: "Invalid GTIN / EAN barcode format or GS1 modulo-10 checksum",
});
export const ProductStatusSchema = z.enum(["draft", "active", "archived"]);
export const ProductSlugSchema = z.string().trim().min(1).max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, digits, and single hyphens");
export const ProductImageSchema = z.string().trim().min(1).max(2_048).refine((value) => {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "Image must be a local absolute path or HTTP(S) URL");

const NullableText = (max: number) => z.string().trim().min(1).max(max).nullable();
const ProductCoreInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  slug: ProductSlugSchema,
  description: NullableText(20_000).default(null),
  status: ProductStatusSchema.default("draft"),
  priceMinor: z.number().int().nonnegative(),
  compareAtPriceMinor: z.number().int().nonnegative().nullable().default(null),
  weightGrams: z.number().int().positive().max(1_000_000),
  images: z.array(ProductImageSchema).max(20).default([]),
  googleCategoryId: z.number().int().positive().nullable().default(null),
  googleCategoryName: NullableText(255).default(null),
  gtin: GtinSchema.nullable().default(null),
  mpn: NullableText(70).default(null),
  brand: NullableText(100).default(null),
});

export const CreateCatalogProductSchema = ProductCoreInputSchema.extend({
  primaryVariant: z.object({
    title: z.string().trim().min(1).max(255).default("Default Title"),
    sku: NullableText(100).default(null),
    stockQuantity: z.number().int().nonnegative().max(1_000_000_000),
  }).strict(),
}).strict().superRefine((value, ctx) => {
  if (value.compareAtPriceMinor !== null && value.compareAtPriceMinor < value.priceMinor) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["compareAtPriceMinor"], message: "Compare-at price must be greater than or equal to price" });
  }
});

export const UpdateCatalogProductSchema = ProductCoreInputSchema.partial().extend({
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  primaryVariant: z.object({
    title: z.string().trim().min(1).max(255).optional(),
    sku: NullableText(100).optional(),
    stockQuantity: z.number().int().nonnegative().max(1_000_000_000).optional(),
  }).strict().optional(),
}).strict().refine((value) => Object.keys(value).some((key) => key !== "expectedUpdatedAt"), "At least one mutable field is required").superRefine((value, ctx) => {
  if (value.priceMinor !== undefined && value.compareAtPriceMinor !== undefined &&
      value.compareAtPriceMinor !== null && value.compareAtPriceMinor < value.priceMinor) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["compareAtPriceMinor"], message: "Compare-at price must be greater than or equal to price" });
  }
});

export const CatalogPrimaryVariantSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(255),
  sku: z.string().max(100).nullable(),
  stockQuantity: z.number().int().nonnegative(),
  priceMinor: z.number().int().nonnegative(),
  compareAtPriceMinor: z.number().int().nonnegative().nullable(),
  weightGrams: z.number().int().positive(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const CatalogProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(255),
  slug: ProductSlugSchema,
  description: z.string().nullable(),
  status: ProductStatusSchema,
  currency: z.literal("IDR"),
  priceMinor: z.number().int().nonnegative(),
  compareAtPriceMinor: z.number().int().nonnegative().nullable(),
  weightGrams: z.number().int().positive(),
  images: z.array(ProductImageSchema),
  googleCategoryId: z.number().int().nullable(),
  googleCategoryName: z.string().nullable(),
  // Legacy persisted rows may predate checksum enforcement; every new mutation uses GtinSchema.
  gtin: z.string().max(14).nullable(),
  mpn: z.string().nullable(),
  brand: z.string().nullable(),
  primaryVariant: CatalogPrimaryVariantSchema.nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

// Backward-compatible aliases for existing package consumers.
export const ProductSchema = CatalogProductSchema;
export const CreateProductSchema = CreateCatalogProductSchema;
