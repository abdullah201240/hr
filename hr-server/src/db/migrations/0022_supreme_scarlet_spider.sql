CREATE TABLE "candidate_stage_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"stage" varchar(50) NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"linkedin" varchar(255),
	"resume_url" text,
	"role" varchar(255) NOT NULL,
	"source" varchar(100) NOT NULL,
	"stage" varchar(50) DEFAULT 'Applied' NOT NULL,
	"applied_date" date NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"interview_date" date,
	"interview_time" varchar(50),
	"interview_location" varchar(255),
	"offer_letter_generated" boolean DEFAULT false NOT NULL,
	"joining_letter_generated" boolean DEFAULT false NOT NULL,
	"offered_salary" varchar(100),
	"offered_start_date" date,
	"joining_manager" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "job_openings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" varchar(255) NOT NULL,
	"department" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"location" varchar(255) NOT NULL,
	"experience" varchar(100) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" varchar(50) DEFAULT 'Open' NOT NULL,
	"date_opened" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_hires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"department" varchar(255) NOT NULL,
	"start_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hire_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_stage_histories" ADD CONSTRAINT "candidate_stage_histories_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_hires" ADD CONSTRAINT "onboarding_hires_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_hire_id_onboarding_hires_id_fk" FOREIGN KEY ("hire_id") REFERENCES "public"."onboarding_hires"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidate_stage_histories_candidate_idx" ON "candidate_stage_histories" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "candidates_stage_idx" ON "candidates" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "candidates_email_idx" ON "candidates" USING btree ("email");--> statement-breakpoint
CREATE INDEX "job_openings_status_idx" ON "job_openings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_openings_department_idx" ON "job_openings" USING btree ("department");--> statement-breakpoint
CREATE INDEX "onboarding_hires_candidate_idx" ON "onboarding_hires" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "onboarding_tasks_hire_idx" ON "onboarding_tasks" USING btree ("hire_id");