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
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_logs_employee_date_idx" ON "attendance_logs" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "attendance_logs_date_idx" ON "attendance_logs" USING btree ("date");--> statement-breakpoint
CREATE INDEX "attendance_logs_status_idx" ON "attendance_logs" USING btree ("status");