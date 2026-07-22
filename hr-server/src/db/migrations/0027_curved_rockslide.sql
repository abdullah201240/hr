CREATE TABLE "task_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"details" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "task_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"status" varchar(50) DEFAULT 'Active' NOT NULL,
	"department_id" uuid,
	"owner_id" uuid
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"status" varchar(50) DEFAULT 'Todo' NOT NULL,
	"priority" varchar(50) DEFAULT 'Medium' NOT NULL,
	"due_date" date,
	"assignee_id" uuid,
	"reporter_id" uuid,
	"estimated_hours" integer DEFAULT 0,
	"actual_hours" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "task_activities" ADD CONSTRAINT "task_activities_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_activities" ADD CONSTRAINT "task_activities_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklists" ADD CONSTRAINT "task_checklists_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_projects" ADD CONSTRAINT "task_projects_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_projects" ADD CONSTRAINT "task_projects_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_task_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_employees_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reporter_id_employees_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;