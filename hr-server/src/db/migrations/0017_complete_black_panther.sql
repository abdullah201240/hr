CREATE TABLE "leave_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leave_application_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leave_attachments" ADD CONSTRAINT "leave_attachments_leave_application_id_leave_applications_id_fk" FOREIGN KEY ("leave_application_id") REFERENCES "public"."leave_applications"("id") ON DELETE cascade ON UPDATE no action;