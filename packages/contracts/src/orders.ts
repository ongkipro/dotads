import { z } from "zod";

export const MultiAdAttributionSchema = z.object({
  fbp: z.string().max(255).optional(),
  fbc: z.string().max(255).optional(),
  gclid: z.string().max(255).optional(),
  gbraid: z.string().max(255).optional(),
  wbraid: z.string().max(255).optional(),
  ttclid: z.string().max(255).optional(),
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
});

export const DraftLeadSchema = z.object({
  tenantId: z.string().uuid(),
  customerName: z.string().trim().min(1).max(255),
  customerPhone: z.string().trim().min(8).max(50),
  productName: z.string().trim().max(255).optional(),
  subdistrictId: z.string().max(50).optional(),
  attribution: MultiAdAttributionSchema.optional(),
});

export const CreateOrderPublicSchema = z.object({
  tenantId: z.string().uuid(),
  customerName: z.string().trim().min(1).max(255),
  customerPhone: z.string().trim().min(8).max(50),
  customerEmail: z.string().email().optional(),
  shippingAddress: z.string().trim().min(5).max(2000),
  subdistrictId: z.string().min(1).max(50),
  courierCode: z.enum(["JNE", "SICEPAT", "J&T", "SAP"]).default("JNE"),
  paymentMethod: z.enum(["COD", "QRIS", "VA_BCA", "VA_MANDIRI", "VA_BRI", "VA_BNI", "VA_PERMATA"]).default("COD"),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().positive().max(999).default(1),
    })
  ).min(1).max(100),
  turnstileToken: z.string().max(2048).optional(),
  attribution: MultiAdAttributionSchema.optional(),
});

export const ShippingRateRequestSchema = z.object({
  tenantId: z.string().uuid(),
  subdistrictId: z.string().min(1).max(50),
  weightGrams: z.number().int().positive().max(1_000_000).default(1000),
  courierCode: z.enum(["JNE", "SICEPAT", "J&T", "SAP"]).optional(),
});
