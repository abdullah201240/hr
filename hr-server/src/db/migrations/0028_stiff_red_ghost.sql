ALTER TABLE "tasks" ADD COLUMN "tags" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "timer_started_at" varchar(100);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "timer_elapsed_seconds" integer DEFAULT 0;