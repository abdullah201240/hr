CREATE TABLE "attendance_settings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"start_time" varchar(10) DEFAULT '09:00' NOT NULL,
	"end_time" varchar(10) DEFAULT '18:00' NOT NULL,
	"break_start" varchar(10) DEFAULT '13:00' NOT NULL,
	"break_end" varchar(10) DEFAULT '14:00' NOT NULL,
	"late_threshold" integer DEFAULT 15 NOT NULL,
	"half_day_threshold" integer DEFAULT 240 NOT NULL,
	"weekly_holidays" jsonb DEFAULT '["Saturday","Sunday"]'::jsonb NOT NULL
);--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL
);