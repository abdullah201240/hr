CREATE TABLE "employee_salaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"template_id" uuid,
	"basic_salary" double precision NOT NULL,
	"effective_date" date NOT NULL,
	"pf_applicable" boolean DEFAULT true NOT NULL,
	"festival_bonus_applicable" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"notes" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "salary_template_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"template_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"calculation_type" varchar(50) NOT NULL,
	"value" double precision NOT NULL,
	"is_taxable" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_salaries" ADD CONSTRAINT "employee_salaries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salaries" ADD CONSTRAINT "employee_salaries_template_id_salary_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."salary_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_template_components" ADD CONSTRAINT "salary_template_components_template_id_salary_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."salary_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_salaries_employee_id_idx" ON "employee_salaries" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_salaries_template_id_idx" ON "employee_salaries" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "employee_salaries_status_idx" ON "employee_salaries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_salaries_effective_date_idx" ON "employee_salaries" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "salary_template_components_template_id_idx" ON "salary_template_components" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "salary_templates_is_active_idx" ON "salary_templates" USING btree ("is_active");