ALTER TABLE "festival_bonus_settings" ALTER COLUMN "eligible_employee_types" SET DEFAULT '["Full-time"]'::jsonb;--> statement-breakpoint
CREATE INDEX "emp_fb_cycle_idx" ON "employee_festival_bonuses" USING btree ("festival_bonus_cycle_id");--> statement-breakpoint
CREATE INDEX "emp_fb_employee_idx" ON "employee_festival_bonuses" USING btree ("employee_id");