CREATE TABLE "regulation_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"allow_employee_requests" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_by_id" uuid NOT NULL,
	"updated_by_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"policy_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"request_date" date DEFAULT now() NOT NULL,
	"effective_from" date,
	"effective_to" date,
	"metadata" jsonb,
	"first_approved_by_id" uuid,
	"first_approved_at" timestamp with time zone,
	"final_approved_by_id" uuid,
	"final_approved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_by_id" uuid,
	"updated_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "regulation_policies" ADD CONSTRAINT "regulation_policies_created_by_id_employees_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_policies" ADD CONSTRAINT "regulation_policies_updated_by_id_employees_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_requests" ADD CONSTRAINT "regulation_requests_policy_id_regulation_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."regulation_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_requests" ADD CONSTRAINT "regulation_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_requests" ADD CONSTRAINT "regulation_requests_first_approved_by_id_employees_id_fk" FOREIGN KEY ("first_approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_requests" ADD CONSTRAINT "regulation_requests_final_approved_by_id_employees_id_fk" FOREIGN KEY ("final_approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_requests" ADD CONSTRAINT "regulation_requests_created_by_id_employees_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation_requests" ADD CONSTRAINT "regulation_requests_updated_by_id_employees_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "regulation_policies_category_idx" ON "regulation_policies" USING btree ("category");--> statement-breakpoint
CREATE INDEX "regulation_policies_is_active_idx" ON "regulation_policies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "regulation_requests_employee_idx" ON "regulation_requests" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "regulation_requests_policy_idx" ON "regulation_requests" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "regulation_requests_status_idx" ON "regulation_requests" USING btree ("status");