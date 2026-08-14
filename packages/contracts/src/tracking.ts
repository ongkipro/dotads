import { z } from "zod";

export const OutboxPlatformEnum = z.enum(["meta", "google", "tiktok"]);
export const OutboxStatusEnum = z.enum(["pending", "processing", "sent", "failed"]);

export const OutboxEventSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  platform: OutboxPlatformEnum,
  destinationId: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  payloadJson: z.record(z.unknown()),
  status: OutboxStatusEnum,
  retryCount: z.number().int(),
  maxAttempts: z.number().int(),
  lastError: z.string().nullable().optional(),
  nextRetryAt: z.string().nullable().optional(),
});
