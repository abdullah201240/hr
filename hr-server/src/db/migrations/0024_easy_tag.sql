CREATE TABLE "issued_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" varchar(50) NOT NULL,
	"employee_id" uuid NOT NULL,
	"subject" varchar(255) NOT NULL,
	"issue_date" date NOT NULL,
	"effective_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'Draft' NOT NULL,
	"body" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" varchar(255) DEFAULT 'HR Admin' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issued_letters" ADD CONSTRAINT "issued_letters_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issued_letters_employee_idx" ON "issued_letters" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "issued_letters_type_idx" ON "issued_letters" USING btree ("type");--> statement-breakpoint
CREATE INDEX "issued_letters_status_idx" ON "issued_letters" USING btree ("status");