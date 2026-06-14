ALTER TABLE "employees" ADD COLUMN "role" varchar(20) DEFAULT 'employee' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "refresh_token_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_email_verified" boolean DEFAULT false NOT NULL;