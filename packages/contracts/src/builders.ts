import { z } from "zod";

export const FormSchemaModeEnum = z.enum(["hybrid", "full", "mini", "middle"]);

export const FormValidationRuleSchema = z.object({
  type: z.enum(["required", "minLength", "maxLength", "pattern", "phone_id", "email"]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  message: z.string().optional(),
});

export const FormConditionRuleSchema = z.object({
  fieldId: z.string(),
  operator: z.enum(["equals", "not_equals", "contains", "is_empty", "is_not_empty"]),
  value: z.string().optional(),
  action: z.enum(["show", "hide", "require", "disable"]),
});

export const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    "text",
    "phone",
    "email",
    "textarea",
    "select",
    "radio",
    "checkbox",
    "address_autocomplete",
    "quantity",
    "product_selector",
    "hidden",
  ]),
  label: z.string(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  validations: z.array(FormValidationRuleSchema).optional(),
  conditions: z.array(FormConditionRuleSchema).optional(),
});

export const FormStyleTokensSchema = z.object({
  primaryColor: z.string().default("#000000"),
  borderRadius: z.string().default("8px"),
  fontSize: z.string().default("16px"),
  fontFamily: z.string().default("sans-serif"),
  customCss: z.string().optional(),
});

export const FormSchemaDefinition = z.object({
  title: z.string(),
  mode: FormSchemaModeEnum.default("hybrid"),
  fields: z.array(FormFieldSchema),
  submitButtonText: z.string().default("Pesan Sekarang"),
  paymentMethods: z.array(z.string()).default(["COD", "QRIS"]),
  styleTokens: FormStyleTokensSchema.optional(),
});

export const CreateFormSchemaContract = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  mode: FormSchemaModeEnum.default("hybrid"),
  schemaJson: FormSchemaDefinition,
});

export const PublishFormSchemaContract = z.object({
  formId: z.string().uuid(),
  changelog: z.string().optional(),
});

// Landing Page Contracts
export const LandingPageBlockSchema = z.object({
  id: z.string(),
  type: z.enum([
    "hero",
    "features",
    "benefits",
    "rich_text",
    "video",
    "testimonials",
    "faq",
    "pricing",
    "product_selection",
    "order_form_embed",
    "footer",
  ]),
  propsJson: z.record(z.unknown()),
});

export const LandingPageSeoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogImage: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
  robots: z.string().default("index, follow"),
});

export const LandingPageDefinition = z.object({
  title: z.string(),
  slug: z.string(),
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  formSchemaId: z.string().uuid().optional(),
  seo: LandingPageSeoSchema.optional(),
  blocks: z.array(LandingPageBlockSchema),
  themeTokensJson: z.record(z.unknown()).optional(),
});

export const CreateLandingPageContract = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  productId: z.string().uuid().optional(),
  formSchemaId: z.string().uuid().optional(),
  pageJson: LandingPageDefinition,
});

export const PublishLandingPageContract = z.object({
  pageId: z.string().uuid(),
  changelog: z.string().optional(),
});
