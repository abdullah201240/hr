CREATE TABLE "leave_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days" integer NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"approved_by_id" uuid,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_approved_by_id_employees_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leave_applications_employee_idx" ON "leave_applications" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "leave_applications_leave_type_idx" ON "leave_applications" USING btree ("leave_type_id");--> statement-breakpoint
CREATE INDEX "leave_applications_status_idx" ON "leave_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leave_applications_dates_idx" ON "leave_applications" USING btree ("start_date","end_date");