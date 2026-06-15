CREATE TABLE "leave_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(50) DEFAULT 'CalendarOff' NOT NULL,
	"color" varchar(50) DEFAULT 'bg-sky-500' NOT NULL,
	"days" integer NOT NULL,
	"paid" boolean DEFAULT true NOT NULL,
	"carry_forward" boolean DEFAULT false NOT NULL,
	"max_carry_over" integer DEFAULT 0 NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"requires_document" boolean DEFAULT false NOT NULL,
	"description" text DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "leave_types_name_idx" ON "leave_types" USING btree ("name");
--> statement-breakpoint
CREATE INDEX "leave_types_is_active_idx" ON "leave_types" USING btree ("is_active");