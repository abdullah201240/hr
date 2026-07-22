-- Remove system role column from employees table if not already removed
ALTER TABLE "employees" DROP COLUMN IF EXISTS "role";

-- Update audit_logs table: drop user_role, add custom_role_id referencing custom_roles
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "user_role";
ALTER TABLE "audit_logs" ADD COLUMN "custom_role_id" uuid;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_custom_role_id_custom_roles_id_fk" FOREIGN KEY ("custom_role_id") REFERENCES "public"."custom_roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;