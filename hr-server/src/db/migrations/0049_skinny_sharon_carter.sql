CREATE TABLE "payroll_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payroll_cycle_id" uuid NOT NULL,
	"employee_payslip_id" uuid,
	"stage" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"comment" text,
	"action_by_id" uuid NOT NULL,
	"action_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payroll_cycles" ALTER COLUMN "status" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "payroll_cycles" ALTER COLUMN "status" SET DEFAULT 'Draft';--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN "status" varchar(30) DEFAULT 'Draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN "lm_approved_by_id" uuid;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN "lm_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN "md_approved_by_id" uuid;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN "md_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payroll_approvals" ADD CONSTRAINT "payroll_approvals_payroll_cycle_id_payroll_cycles_id_fk" FOREIGN KEY ("payroll_cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_approvals" ADD CONSTRAINT "payroll_approvals_employee_payslip_id_employee_payslips_id_fk" FOREIGN KEY ("employee_payslip_id") REFERENCES "public"."employee_payslips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_approvals" ADD CONSTRAINT "payroll_approvals_action_by_id_employees_id_fk" FOREIGN KEY ("action_by_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payroll_approvals_cycle_idx" ON "payroll_approvals" USING btree ("payroll_cycle_id");--> statement-breakpoint
CREATE INDEX "payroll_approvals_payslip_idx" ON "payroll_approvals" USING btree ("employee_payslip_id");--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD CONSTRAINT "employee_payslips_lm_approved_by_id_employees_id_fk" FOREIGN KEY ("lm_approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD CONSTRAINT "employee_payslips_md_approved_by_id_employees_id_fk" FOREIGN KEY ("md_approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_payslips_status_idx" ON "employee_payslips" USING btree ("status");