ALTER TABLE "attendance_settings" ADD COLUMN IF NOT EXISTS "two_step_leave_threshold_days" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_settings" ADD COLUMN IF NOT EXISTS "two_step_claim_threshold_amount" numeric(12, 2) DEFAULT '1000.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "custom_role_id" uuid;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "first_approved_by_id" uuid;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "first_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD COLUMN IF NOT EXISTS "first_approved_by_id" uuid;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD COLUMN IF NOT EXISTS "first_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN IF NOT EXISTS "total_working_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN IF NOT EXISTS "present_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN IF NOT EXISTS "absent_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN IF NOT EXISTS "leave_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD COLUMN IF NOT EXISTS "late_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_custom_role_id_custom_roles_id_fk" FOREIGN KEY ("custom_role_id") REFERENCES "public"."custom_roles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "claims" ADD CONSTRAINT "claims_first_approved_by_id_employees_id_fk" FOREIGN KEY ("first_approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_first_approved_by_id_employees_id_fk" FOREIGN KEY ("first_approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_activities_task_idx" ON "task_activities" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_attachments_task_idx" ON "task_attachments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_checklists_task_idx" ON "task_checklists" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_comments_task_idx" ON "task_comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_comments_user_idx" ON "task_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_dependencies_task_idx" ON "task_dependencies" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_dependencies_depends_on_idx" ON "task_dependencies" USING btree ("depends_on_task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_milestones_project_idx" ON "task_milestones" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_projects_dept_idx" ON "task_projects" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_projects_owner_idx" ON "task_projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_project_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_assignee_idx" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_milestone_idx" ON "tasks" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_entries_task_idx" ON "time_entries" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_entries_employee_idx" ON "time_entries" USING btree ("employee_id");--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "user_role";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN IF EXISTS "role";
