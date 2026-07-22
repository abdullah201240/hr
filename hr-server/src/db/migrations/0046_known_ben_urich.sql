DROP TABLE "festival_bonus_rules" CASCADE;--> statement-breakpoint
ALTER TABLE "employee_salaries" DROP COLUMN "festival_bonus_applicable";--> statement-breakpoint
ALTER TABLE "employee_payslips" DROP COLUMN "bonus_amount";--> statement-breakpoint
ALTER TABLE "employee_payslips" DROP COLUMN "bonus_description";--> statement-breakpoint
ALTER TABLE "employee_payslips" DROP COLUMN "festival_bonus_amount";--> statement-breakpoint
ALTER TABLE "final_settlements" DROP COLUMN "festival_bonus_adjustment";