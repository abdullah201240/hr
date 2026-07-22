ALTER TABLE "attendance_settings" ADD COLUMN "two_step_claim_threshold_amount" numeric(12, 2) DEFAULT '1000.00' NOT NULL;
ALTER TABLE "claims" ADD COLUMN "first_approved_by_id" uuid;
ALTER TABLE "claims" ADD COLUMN "first_approved_at" timestamp with time zone;
DO $$ BEGIN
 ALTER TABLE "claims" ADD CONSTRAINT "claims_first_approved_by_id_employees_id_fk" FOREIGN KEY ("first_approved_by_id") REFERENCES "employees"("id") ON DELETE set null;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
