ALTER TABLE "issued_letters" ALTER COLUMN "employee_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "issued_letters" ADD COLUMN "employee_name" varchar(255);--> statement-breakpoint
ALTER TABLE "issued_letters" ADD COLUMN "employee_email" varchar(255);