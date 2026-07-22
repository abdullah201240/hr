-- Add threshold days for 2-step leave approval to attendance settings
ALTER TABLE "attendance_settings" ADD COLUMN IF NOT EXISTS "two_step_leave_threshold_days" integer DEFAULT 2 NOT NULL;

-- Add tracking columns for first approval step in leave applications
ALTER TABLE "leave_applications" ADD COLUMN IF NOT EXISTS "first_approved_by_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL;
ALTER TABLE "leave_applications" ADD COLUMN IF NOT EXISTS "first_approved_at" timestamp with time zone;
