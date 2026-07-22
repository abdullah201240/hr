-- Custom migration: Add performance indexes to employees table
CREATE INDEX IF NOT EXISTS "employees_employee_type_idx" ON "employees" USING btree ("employee_type");
CREATE INDEX IF NOT EXISTS "employees_full_name_english_idx" ON "employees" USING btree ("full_name_english");
