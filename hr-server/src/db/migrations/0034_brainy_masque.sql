ALTER TABLE "employee_payslips" ADD COLUMN "allowances" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN "deductions" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "payroll_cycles" ADD COLUMN "is_processing" boolean DEFAULT false NOT NULL;