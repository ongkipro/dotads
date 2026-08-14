CREATE TABLE "draft_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_name" varchar(255),
	"customer_phone" varchar(50),
	"draft_data_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "draft_leads" ADD CONSTRAINT "draft_leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_draft_leads_tenant" ON "draft_leads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_draft_leads_phone" ON "draft_leads" USING btree ("customer_phone");