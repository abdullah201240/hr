-- Remove system role column from employees table
-- All access control is now enforced exclusively through custom role permissions
ALTER TABLE "employees" DROP COLUMN IF EXISTS "role";
