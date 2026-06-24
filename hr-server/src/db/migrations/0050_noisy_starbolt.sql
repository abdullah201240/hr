DROP TABLE "salary_adjustments" CASCADE;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_salary" boolean DEFAULT true NOT NULL;