import { z } from "zod";

/**
 * Validates GS1 GTIN (EAN-13, UPC-12, GTIN-8, GTIN-14) using standard Modulo-10 Checksum Algorithm
 */
export function validateGtinChecksum(gtin: string): boolean {
  if (!/^\d{8}|\d{12}|\d{13}|\d{14}$/.test(gtin)) {
    return false;
  }
  const digits = gtin.split("").map(Number);
  const checkDigit = digits.pop()!;
  let sum = 0;
  const reversed = digits.reverse();

  for (let i = 0; i < reversed.length; i++) {
    sum += i % 2 === 0 ? reversed[i] * 3 : reversed[i];
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return checkDigit === calculatedCheckDigit;
}

export const GtinSchema = z
  .string()
  .refine(validateGtinChecksum, {
    message: "Invalid GTIN / EAN barcode format or GS1 modulo-10 checksum",
  });

export const ProductSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  priceMinor: z.number().int().nonnegative(),
  compareAtPriceMinor: z.number().int().nonnegative().optional(),
  weightGrams: z.number().int().positive().default(1000),
  imagesJson: z.array(z.string().url()).default([]),
  googleCategoryId: z.number().int().optional(),
  googleCategoryName: z.string().optional(),
  gtin: GtinSchema.optional(),
  mpn: z.string().max(70).optional(),
  brand: z.string().max(100).optional(),
});

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  tenantId: true,
});
