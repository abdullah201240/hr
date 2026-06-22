CREATE TABLE "salary_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"target_month_key" varchar(10) NOT NULL,
	"applied_month_key" varchar(10) NOT NULL,
	"adjustment_type" varchar(20) NOT NULL,
	"amount" double precision NOT NULL,
	"reason" text NOT NULL,
	"original_payslip_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_original_payslip_id_employee_payslips_id_fk" FOREIGN KEY ("original_payslip_id") REFERENCES "public"."employee_payslips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "salary_adjustments_employee_idx" ON "salary_adjustments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "salary_adjustments_target_month_idx" ON "salary_adjustments" USING btree ("target_month_key");--> statement-breakpoint
CREATE INDEX "salary_adjustments_applied_month_idx" ON "salary_adjustments" USING btree ("applied_month_key");--> statement-breakpoint
CREATE INDEX "salary_adjustments_status_idx" ON "salary_adjustments" USING btree ("status");