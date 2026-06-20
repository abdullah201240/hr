ALTER TABLE "task_comments" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "task_comments" ADD COLUMN "category" varchar(50) DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "task_comments" ADD COLUMN "reactions" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "work_status" varchar(50) DEFAULT 'Idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "approval_status" varchar(50) DEFAULT 'Pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "review_rating" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "review_feedback" text;