CREATE TABLE "appraisal_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "employee_appraisals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'pending_self' NOT NULL,
	"self_score" integer,
	"manager_score" integer,
	"final_score" integer,
	"self_feedback" text,
	"manager_feedback" text,
	"promotion_recommended" boolean DEFAULT false NOT NULL,
	"promotion_readiness" varchar(50) DEFAULT 'not_eligible' NOT NULL,
	"recommended_designation_id" uuid,
	"manager_notes" text,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "employee_kpis" ADD COLUMN "cycle_id" uuid;--> statement-breakpoint
ALTER TABLE "employee_kpis" ADD COLUMN "self_score" integer;--> statement-breakpoint
ALTER TABLE "employee_kpis" ADD COLUMN "manager_score" integer;--> statement-breakpoint
ALTER TABLE "employee_kpis" ADD COLUMN "comments" text;--> statement-breakpoint
ALTER TABLE "employee_appraisals" ADD CONSTRAINT "employee_appraisals_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_appraisals" ADD CONSTRAINT "employee_appraisals_cycle_id_appraisal_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."appraisal_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_appraisals" ADD CONSTRAINT "employee_appraisals_recommended_designation_id_designations_id_fk" FOREIGN KEY ("recommended_designation_id") REFERENCES "public"."designations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_kpis" ADD CONSTRAINT "employee_kpis_cycle_id_appraisal_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."appraisal_cycles"("id") ON DELETE cascade ON UPDATE no action;