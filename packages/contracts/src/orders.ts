import { z } from "zod";

export const MultiAdAttributionSchema = z.object({
  fbp: z.string().optional(),
  fbc: z.string().optional(),
  gclid: z.string().optional(),
  gbraid: z.string().optional(),
  wbraid: z.string().optional(),
  ttclid: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export const DraftLeadSchema = z.object({
  tenantId: z.string().uuid(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(8),
  productName: z.string().optional(),
  subdistrictId: z.string().optional(),
  attribution: MultiAdAttributionSchema.optional(),
});

export const CreateOrderPublicSchema = z.object({
  tenantId: z.string().uuid(),
  customerName: z.string().min(1).max(255),
  customerPhone: z.string().min(8).max(50),
  customerEmail: z.string().email().optional(),
  shippingAddress: z.string().min(5),
  subdistrictId: z.string().min(1),
  courierCode: z.enum(["JNE", "SICEPAT", "J&T", "SAP"]).default("JNE"),
  paymentMethod: z.enum(["COD", "QRIS", "VA_BCA", "VA_MANDIRI", "VA_BRI", "VA_BNI", "VA_PERMATA"]).default("COD"),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().positive().default(1),
    })
  ).min(1),
  turnstileToken: z.string().optional(),
  attribution: MultiAdAttributionSchema.optional(),
});

export const ShippingRateRequestSchema = z.object({
  tenantId: z.string().uuid(),
  subdistrictId: z.string().min(1),
  weightGrams: z.number().int().positive().default(1000),
  courierCode: z.enum(["JNE", "SICEPAT", "J&T", "SAP"]).optional(),
});
