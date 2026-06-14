-- Custom migration: varchar department/designation → UUID foreign keys
-- This migration requires data to exist in departments/designations tables.
-- Run AFTER departments and designations are populated.

-- ─── Step 1: Fix head_employee_id in departments (varchar → uuid) ─────────
ALTER TABLE "departments" DROP COLUMN IF EXISTS "head_employee_id";
ALTER TABLE "departments" ADD COLUMN "head_employee_id" uuid;
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_employee_id_employees_id_fk"
  FOREIGN KEY ("head_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;

-- ─── Step 2: Add new UUID FK columns to employees ─────────────────────────
ALTER TABLE "employees" ADD COLUMN "department_id" uuid;
ALTER TABLE "employees" ADD COLUMN "designation_id" uuid;

-- ─── Step 3: Migrate existing data from varchar → uuid ────────────────────
UPDATE "employees" e
  SET "department_id" = d."id"
  FROM "departments" d
  WHERE e."department" = d."name";

UPDATE "employees" e
  SET "designation_id" = d."id"
  FROM "designations" d
  WHERE e."designation" = d."name";

-- ─── Step 4: Set NOT NULL and add FK constraints ──────────────────────────
ALTER TABLE "employees" ALTER COLUMN "department_id" SET NOT NULL;
ALTER TABLE "employees" ALTER COLUMN "designation_id" SET NOT NULL;

ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk"
  FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_designations_id_fk"
  FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE restrict ON UPDATE no action;

-- ─── Step 5: Drop old varchar columns and their indexes ───────────────────
DROP INDEX IF EXISTS "employees_department_idx";
ALTER TABLE "employees" DROP COLUMN "department";
ALTER TABLE "employees" DROP COLUMN "designation";

-- ─── Step 6: Create indexes on new FK columns ─────────────────────────────
CREATE INDEX "employees_department_id_idx" ON "employees" USING btree ("department_id");
CREATE INDEX "employees_designation_id_idx" ON "employees" USING btree ("designation_id");
