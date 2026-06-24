CREATE TABLE "employee_festival_bonuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"festival_bonus_cycle_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"basic_salary" double precision NOT NULL,
	"gross_salary" double precision NOT NULL,
	"service_months" double precision NOT NULL,
	"calculated_amount" double precision NOT NULL,
	"override_amount" double precision,
	"final_amount" double precision NOT NULL,
	"is_eligible" boolean DEFAULT true NOT NULL,
	"eligibility_reason" varchar(255),
	"special_approval_granted" boolean DEFAULT false NOT NULL,
	"special_approval_by" uuid,
	"status" varchar(30) DEFAULT 'Calculated' NOT NULL,
	"payment_method" varchar(50),
	"payment_ref" varchar(100),
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "festival_bonus_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(100) NOT NULL,
	"festival_date" timestamp with time zone NOT NULL,
	"status" varchar(30) DEFAULT 'Draft' NOT NULL,
	"total_amount" double precision DEFAULT 0 NOT NULL,
	"total_employees" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_festival_bonuses" ADD CONSTRAINT "employee_festival_bonuses_festival_bonus_cycle_id_festival_bonus_cycles_id_fk" FOREIGN KEY ("festival_bonus_cycle_id") REFERENCES "public"."festival_bonus_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_festival_bonuses" ADD CONSTRAINT "employee_festival_bonuses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_festival_bonuses" ADD CONSTRAINT "employee_festival_bonuses_special_approval_by_employees_id_fk" FOREIGN KEY ("special_approval_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;