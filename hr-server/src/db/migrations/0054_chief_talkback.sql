ALTER TABLE "attendance_settings" ADD COLUMN "early_out_threshold" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_settings" ADD COLUMN "max_late_allowed_per_month" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_settings" ADD COLUMN "late_to_day_deduction_rate" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_settings" ADD COLUMN "max_early_out_allowed_per_month" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_settings" ADD COLUMN "early_out_to_day_deduction_rate" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_settings" ADD COLUMN "enable_late_deduction" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_settings" ADD COLUMN "enable_early_out_deduction" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN "early_out_days" integer DEFAULT 0 NOT NULL;