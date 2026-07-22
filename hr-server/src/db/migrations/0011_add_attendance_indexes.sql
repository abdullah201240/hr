-- Performance indexes for attendance subsystem
-- holidays: queried by date range on every job run and employee log view
CREATE INDEX IF NOT EXISTS "holidays_start_date_idx" ON "holidays" ("start_date");
CREATE INDEX IF NOT EXISTS "holidays_end_date_idx" ON "holidays" ("end_date");

-- attendance_logs: correction status queried for pending corrections list
CREATE INDEX IF NOT EXISTS "attendance_logs_correction_status_idx" ON "attendance_logs" ("correction_status");
