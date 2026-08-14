CREATE TABLE "tenant_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"hostname" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"verification_token" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_domains_hostname_unique" UNIQUE("hostname")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"tier" varchar(50) DEFAULT 'pro' NOT NULL,
	"custom_domain" varchar(255),
	"settings_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'ADMIN' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(50) DEFAULT 'ADMIN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "roles_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" varchar(50) NOT NULL,
	"permission" varchar(100) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"sku" varchar(100),
	"price_minor" integer NOT NULL,
	"compare_at_price_minor" integer,
	"weight_grams" integer DEFAULT 1000 NOT NULL,
	"stock_quantity" integer DEFAULT 100 NOT NULL,
	"gtin" varchar(14),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"price_minor" integer NOT NULL,
	"compare_at_price_minor" integer,
	"weight_grams" integer DEFAULT 1000 NOT NULL,
	"images_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"google_category_id" integer,
	"google_category_name" varchar(255),
	"gtin" varchar(14),
	"mpn" varchar(70),
	"brand" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"event" varchar(50) NOT NULL,
	"actor" varchar(255) NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"product_name" varchar(255) NOT NULL,
	"variant_title" varchar(255),
	"sku" varchar(100),
	"price_minor" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"subtotal_minor" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"payment_status" varchar(30) DEFAULT 'UNPAID' NOT NULL,
	"fulfillment_status" varchar(30) DEFAULT 'UNFULFILLED' NOT NULL,
	"payment_method" varchar(30) DEFAULT 'COD' NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(50) NOT NULL,
	"customer_email" varchar(255),
	"shipping_address" text NOT NULL,
	"subdistrict_id" varchar(50),
	"subdistrict_name" varchar(255),
	"city_id" varchar(50),
	"city_name" varchar(255),
	"province_id" varchar(50),
	"province_name" varchar(255),
	"postal_code" varchar(20),
	"subtotal_minor" integer DEFAULT 0 NOT NULL,
	"shipping_cost_minor" integer DEFAULT 0 NOT NULL,
	"discount_minor" integer DEFAULT 0 NOT NULL,
	"total_minor" integer DEFAULT 0 NOT NULL,
	"cnote_no" varchar(100),
	"courier_code" varchar(50),
	"courier_service" varchar(50),
	"rts_risk_score" integer DEFAULT 0,
	"attribution_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_schema_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"schema_json" jsonb NOT NULL,
	"published_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_schemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"mode" varchar(20) DEFAULT 'hybrid' NOT NULL,
	"published_version" integer DEFAULT 0,
	"draft_schema_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_page_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"components_json" jsonb NOT NULL,
	"published_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_version" integer DEFAULT 0,
	"draft_components_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"og_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autolaris_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"api_secret" text NOT NULL,
	"merchant_id" varchar(100) NOT NULL,
	"sandbox" boolean DEFAULT false NOT NULL,
	"qris_enabled" boolean DEFAULT true NOT NULL,
	"va_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mengantar_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"api_key" text NOT NULL,
	"sandbox" boolean DEFAULT false NOT NULL,
	"default_courier" varchar(50) DEFAULT 'JNE' NOT NULL,
	"auto_dispatch_cod" boolean DEFAULT true NOT NULL,
	"rts_threshold_score" integer DEFAULT 50 NOT NULL,
	"sender_name" varchar(255),
	"sender_phone" varchar(50),
	"sender_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mengantar_dispatch_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_retry_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mengantar_locations" (
	"subdistrict_id" varchar(50) PRIMARY KEY NOT NULL,
	"subdistrict_name" varchar(255) NOT NULL,
	"city_name" varchar(255) NOT NULL,
	"province_name" varchar(255) NOT NULL,
	"postal_code" varchar(20),
	"zone_group" varchar(50) DEFAULT 'ZONE_1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"gateway" varchar(50) DEFAULT 'AUTOLARIS' NOT NULL,
	"transaction_id" varchar(255) NOT NULL,
	"amount_minor" integer NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"qr_url" text,
	"va_number" varchar(100),
	"bank_code" varchar(50),
	"raw_callback_json" jsonb,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"platform" varchar(20) NOT NULL,
	"destination_id" varchar(100) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_name" varchar(100) NOT NULL,
	"payload_json" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"last_error" text,
	"next_retry_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"meta_pixel_id" varchar(100),
	"meta_capi_token" text,
	"meta_enabled" boolean DEFAULT true NOT NULL,
	"google_tag_id" varchar(100),
	"google_ads_conversion_id" varchar(100),
	"google_ads_conversion_label" varchar(100),
	"google_enabled" boolean DEFAULT true NOT NULL,
	"tiktok_pixel_id" varchar(100),
	"tiktok_access_token" text,
	"tiktok_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"actor_id" text NOT NULL,
	"actor_email" varchar(255) NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" text NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"key" varchar(255) NOT NULL,
	"request_path" varchar(255) NOT NULL,
	"response_code" integer NOT NULL,
	"response_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_schema_versions" ADD CONSTRAINT "form_schema_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_schema_versions" ADD CONSTRAINT "form_schema_versions_form_id_form_schemas_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_schemas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_schemas" ADD CONSTRAINT "form_schemas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_versions" ADD CONSTRAINT "landing_page_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_versions" ADD CONSTRAINT "landing_page_versions_page_id_landing_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autolaris_configs" ADD CONSTRAINT "autolaris_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mengantar_configs" ADD CONSTRAINT "mengantar_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mengantar_dispatch_queue" ADD CONSTRAINT "mengantar_dispatch_queue_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mengantar_dispatch_queue" ADD CONSTRAINT "mengantar_dispatch_queue_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_configs" ADD CONSTRAINT "tracking_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tenant_domains_tenant" ON "tenant_domains" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_hostname" ON "tenant_domains" USING btree ("hostname");--> statement-breakpoint
CREATE INDEX "idx_accounts_user" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_invitations_org" ON "invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_members_org" ON "members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_members_user" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_org_user" ON "members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_tenant" ON "organizations" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_role_perm" ON "roles_permissions" USING btree ("role","permission");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_variants_tenant" ON "product_variants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_variants_product" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_products_tenant" ON "products" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_product_slug" ON "products" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "idx_order_events_tenant" ON "order_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_order_events_order" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_tenant" ON "order_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant" ON "orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_orders_cnote" ON "orders" USING btree ("cnote_no");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_order_num" ON "orders" USING btree ("tenant_id","order_number");--> statement-breakpoint
CREATE INDEX "idx_form_versions_tenant" ON "form_schema_versions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_form_versions_form" ON "form_schema_versions" USING btree ("form_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_form_version" ON "form_schema_versions" USING btree ("form_id","version");--> statement-breakpoint
CREATE INDEX "idx_forms_tenant" ON "form_schemas" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_form_slug" ON "form_schemas" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "idx_page_versions_tenant" ON "landing_page_versions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_page_versions_page" ON "landing_page_versions" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_page_version" ON "landing_page_versions" USING btree ("page_id","version");--> statement-breakpoint
CREATE INDEX "idx_pages_tenant" ON "landing_pages" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_page_slug" ON "landing_pages" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "idx_autolaris_config_tenant" ON "autolaris_configs" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_autolaris" ON "autolaris_configs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mengantar_config_tenant" ON "mengantar_configs" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_mengantar" ON "mengantar_configs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mengantar_queue_tenant" ON "mengantar_dispatch_queue" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mengantar_queue_status" ON "mengantar_dispatch_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_mengantar_queue_retry" ON "mengantar_dispatch_queue" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_mengantar_loc_search" ON "mengantar_locations" USING btree ("subdistrict_name","city_name");--> statement-breakpoint
CREATE INDEX "idx_payments_tenant" ON "payment_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_payments_order" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_gateway_trans" ON "payment_transactions" USING btree ("gateway","transaction_id");--> statement-breakpoint
CREATE INDEX "idx_outbox_tenant" ON "outbox_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_outbox_status_platform" ON "outbox_events" USING btree ("status","platform");--> statement-breakpoint
CREATE INDEX "idx_outbox_retry" ON "outbox_events" USING btree ("next_retry_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_platform_event" ON "outbox_events" USING btree ("tenant_id","platform","event_id");--> statement-breakpoint
CREATE INDEX "idx_tracking_config_tenant" ON "tracking_configs" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_tracking" ON "tracking_configs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_audit_tenant" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_audit_actor" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_idempotency_tenant" ON "idempotency_keys" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_tenant_idempotency_key" ON "idempotency_keys" USING btree ("tenant_id","key");