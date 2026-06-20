ALTER TABLE "tasks" ALTER COLUMN "estimated_hours" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "actual_hours" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "task_projects" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "deleted_at" timestamp with time zone;