CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(50) DEFAULT 'info' NOT NULL,
	"department" varchar(255) DEFAULT 'All Departments' NOT NULL,
	"date" date NOT NULL,
	"author_id" uuid,
	"author_name" varchar(255) DEFAULT 'HR Admin' NOT NULL,
	"status" varchar(20) DEFAULT 'Published' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" varchar(20) DEFAULT 'absent' NOT NULL,
	"check_in" varchar(15),
	"check_out" varchar(15),
	"hours" double precision,
	"break_hours" double precision DEFAULT 0 NOT NULL,
	"location" varchar(20),
	"ip_address" varchar(45),
	"device" varchar(255),
	"notes" varchar(255),
	"correction_status" varchar(20) DEFAULT 'none' NOT NULL,
	"proposed_check_in" varchar(15),
	"proposed_check_out" varchar(15),
	"correction_reason" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "attendance_settings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"start_time" varchar(10) DEFAULT '09:00' NOT NULL,
	"end_time" varchar(10) DEFAULT '18:00' NOT NULL,
	"break_start" varchar(10) DEFAULT '13:00' NOT NULL,
	"break_end" varchar(10) DEFAULT '14:00' NOT NULL,
	"late_threshold" integer DEFAULT 15 NOT NULL,
	"half_day_threshold" integer DEFAULT 240 NOT NULL,
	"weekly_holidays" jsonb DEFAULT '["Saturday","Sunday"]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text DEFAULT '',
	"head_employee_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text DEFAULT '',
	"grade" varchar(50) DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
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
	"designation_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"employee_type" varchar(50) NOT NULL,
	"join_date" date NOT NULL,
	"line_manager_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"inactive_date" date,
	"role" varchar(20) DEFAULT 'employee' NOT NULL,
	"refresh_token_version" integer DEFAULT 1 NOT NULL,
	"last_login_at" timestamp with time zone,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"deleted_at" date
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(50) DEFAULT 'CalendarOff' NOT NULL,
	"color" varchar(50) DEFAULT 'bg-sky-500' NOT NULL,
	"days" integer NOT NULL,
	"paid" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"requires_document" boolean DEFAULT false NOT NULL,
	"description" text DEFAULT '',
	"clause" varchar(50),
	"carry_forward" boolean DEFAULT false NOT NULL,
	"max_carry_over_days" integer,
	"encashment" boolean DEFAULT false NOT NULL,
	"encashment_percent" integer,
	"is_pro_rata" boolean DEFAULT false NOT NULL,
	"sandwich_rule" boolean DEFAULT false NOT NULL,
	"comp_leave_expiry_days" integer,
	"eligibility" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_employees_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_employee_id_employees_id_fk" FOREIGN KEY ("head_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_bank_details" ADD CONSTRAINT "employee_bank_details_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_children" ADD CONSTRAINT "employee_children_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_nominees" ADD CONSTRAINT "employee_nominees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_spouses" ADD CONSTRAINT "employee_spouses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_date_idx" ON "announcements" USING btree ("date");--> statement-breakpoint
CREATE INDEX "announcements_status_idx" ON "announcements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "announcements_category_idx" ON "announcements" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_logs_employee_date_idx" ON "attendance_logs" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "attendance_logs_date_idx" ON "attendance_logs" USING btree ("date");--> statement-breakpoint
CREATE INDEX "attendance_logs_status_idx" ON "attendance_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attendance_logs_correction_status_idx" ON "attendance_logs" USING btree ("correction_status");--> statement-breakpoint
CREATE INDEX "holidays_start_date_idx" ON "holidays" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "holidays_end_date_idx" ON "holidays" USING btree ("end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_code_idx" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_name_idx" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "departments_is_active_idx" ON "departments" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "designations_code_idx" ON "designations" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "designations_name_idx" ON "designations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "designations_is_active_idx" ON "designations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "employee_children_employee_id_idx" ON "employee_children" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_documents_employee_id_idx" ON "employee_documents" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_nominees_employee_id_idx" ON "employee_nominees" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_spouses_employee_id_idx" ON "employee_spouses" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_employee_id_idx" ON "employees" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_email_idx" ON "employees" USING btree ("email");--> statement-breakpoint
CREATE INDEX "employees_department_id_idx" ON "employees" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "employees_designation_id_idx" ON "employees" USING btree ("designation_id");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employees_employee_type_idx" ON "employees" USING btree ("employee_type");--> statement-breakpoint
CREATE INDEX "employees_join_date_idx" ON "employees" USING btree ("join_date");--> statement-breakpoint
CREATE INDEX "employees_full_name_english_idx" ON "employees" USING btree ("full_name_english");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_types_name_idx" ON "leave_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "leave_types_is_active_idx" ON "leave_types" USING btree ("is_active");