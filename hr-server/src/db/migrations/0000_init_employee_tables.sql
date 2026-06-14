CREATE TABLE "employee_bank_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"bank_name" varchar(255) DEFAULT '',
	"branch" varchar(255) DEFAULT '',
	"account_number" varchar(100) DEFAULT '',
	"account_type" varchar(50) DEFAULT '',
	"routing_number" varchar(50) DEFAULT '',
	"swift_code" varchar(50) DEFAULT '',
	"iban_number" varchar(100) DEFAULT '',
	"bank_statement_pdf_url" text,
	CONSTRAINT "employee_bank_details_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "employee_children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"date_of_birth" date,
	"gender" varchar(30) DEFAULT 'Not Specified'
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"file_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_nominees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"relation" varchar(100) DEFAULT '',
	"nid_number" varchar(50) DEFAULT '',
	"nid_pdf_url" text,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "employee_spouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"nid" varchar(50) DEFAULT '',
	"phone" varchar(30) DEFAULT '',
	"occupation" varchar(255) DEFAULT '',
	"marriage_date" date
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"personal_email" varchar(255) DEFAULT '',
	"password_hash" text NOT NULL,
	"full_name_english" varchar(255) NOT NULL,
	"full_name_bangla" varchar(255) DEFAULT '',
	"phone" varchar(30) NOT NULL,
	"personal_mobile_number" varchar(30) DEFAULT '',
	"religion" varchar(50) NOT NULL,
	"gender" varchar(30) NOT NULL,
	"date_of_birth" date NOT NULL,
	"blood_group" varchar(10) DEFAULT 'Not Specified',
	"marital_status" varchar(20) DEFAULT 'Single',
	"employee_photo_url" text,
	"nid_number" varchar(50) NOT NULL,
	"nid_pdf_url" text,
	"tin_number" varchar(50) DEFAULT '',
	"father_name_english" varchar(255) DEFAULT '',
	"father_name_bangla" varchar(255) DEFAULT '',
	"mother_name_english" varchar(255) DEFAULT '',
	"mother_name_bangla" varchar(255) DEFAULT '',
	"current_address" text DEFAULT '',
	"permanent_address" text DEFAULT '',
	"emergency_contact_name" varchar(255) DEFAULT '',
	"emergency_contact_relation" varchar(100) DEFAULT '',
	"emergency_contact_number" varchar(30) DEFAULT '',
	"designation" varchar(255) NOT NULL,
	"department" varchar(255) NOT NULL,
	"employee_type" varchar(50) NOT NULL,
	"join_date" date NOT NULL,
	"line_manager_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"deleted_at" date
);
--> statement-breakpoint
ALTER TABLE "employee_bank_details" ADD CONSTRAINT "employee_bank_details_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_children" ADD CONSTRAINT "employee_children_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_nominees" ADD CONSTRAINT "employee_nominees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_spouses" ADD CONSTRAINT "employee_spouses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_children_employee_id_idx" ON "employee_children" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_documents_employee_id_idx" ON "employee_documents" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_nominees_employee_id_idx" ON "employee_nominees" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_spouses_employee_id_idx" ON "employee_spouses" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_employee_id_idx" ON "employees" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_email_idx" ON "employees" USING btree ("email");--> statement-breakpoint
CREATE INDEX "employees_department_idx" ON "employees" USING btree ("department");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employees_join_date_idx" ON "employees" USING btree ("join_date");