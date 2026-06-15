-- Add inactive_date column to employees table for scheduled status changes
ALTER TABLE "employees" ADD COLUMN "inactive_date" date;
