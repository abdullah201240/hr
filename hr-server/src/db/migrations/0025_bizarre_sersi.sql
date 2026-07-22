CREATE TABLE "disciplinary_cases" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_name" varchar(255) NOT NULL,
	"employee_email" varchar(255) NOT NULL,
	"offense_type" varchar(255) NOT NULL,
	"date_reported" date NOT NULL,
	"status" varchar(100) NOT NULL,
	"show_cause_notice" text DEFAULT '',
	"employee_explanation" text DEFAULT '',
	"final_action" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "employee_kpis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"target_metric" varchar(255) NOT NULL,
	"weight" integer NOT NULL,
	"score" integer
);
--> statement-breakpoint
CREATE TABLE "separation_records" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_name" varchar(255) NOT NULL,
	"employee_email" varchar(255) NOT NULL,
	"department" varchar(255) NOT NULL,
	"last_working_day" date NOT NULL,
	"reason" text DEFAULT '',
	"status" varchar(100) NOT NULL,
	"clearance_it" boolean DEFAULT false NOT NULL,
	"clearance_finance" boolean DEFAULT false NOT NULL,
	"clearance_hr" boolean DEFAULT false NOT NULL,
	"clearance_manager" boolean DEFAULT false NOT NULL,
	"asset_laptop" boolean DEFAULT false NOT NULL,
	"asset_access_card" boolean DEFAULT false NOT NULL,
	"asset_keys" boolean DEFAULT false NOT NULL,
	"asset_other" boolean DEFAULT false NOT NULL,
	"handover_completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_chart_nodes" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"parent_id" varchar(255),
	"person_name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"department" varchar(255) NOT NULL,
	"grade" varchar(50) NOT NULL,
	"headcount" integer DEFAULT 1 NOT NULL,
	"open_roles" integer DEFAULT 0 NOT NULL,
	"avatar_color" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_kpis" ADD CONSTRAINT "employee_kpis_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_chart_nodes" ADD CONSTRAINT "org_chart_nodes_parent_id_org_chart_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."org_chart_nodes"("id") ON DELETE cascade ON UPDATE no action;