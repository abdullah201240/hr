CREATE TABLE "disbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"month_key" varchar(10) NOT NULL,
	"disbursement_date" date NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"reference_id" varchar(255) NOT NULL,
	"total_disbursed" double precision NOT NULL,
	"employee_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_payslips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payroll_cycle_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"basic_salary" double precision NOT NULL,
	"allowance_hra" double precision DEFAULT 0 NOT NULL,
	"allowance_transport" double precision DEFAULT 0 NOT NULL,
	"allowance_medical" double precision DEFAULT 0 NOT NULL,
	"deduction_tax" double precision DEFAULT 0 NOT NULL,
	"deduction_pf" double precision DEFAULT 0 NOT NULL,
	"bonus_amount" double precision DEFAULT 0 NOT NULL,
	"bonus_description" varchar(255) DEFAULT '' NOT NULL,
	"festival_bonus_amount" double precision DEFAULT 0 NOT NULL,
	"net_pay" double precision NOT NULL,
	"payment_status" varchar(20) DEFAULT 'Unpaid' NOT NULL,
	"payment_method" varchar(50),
	"payment_date" date,
	"payment_reference" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "payroll_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"month_key" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'Draft' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD CONSTRAINT "employee_payslips_payroll_cycle_id_payroll_cycles_id_fk" FOREIGN KEY ("payroll_cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payslips" ADD CONSTRAINT "employee_payslips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "disbursements_month_key_idx" ON "disbursements" USING btree ("month_key");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_payslips_cycle_employee_idx" ON "employee_payslips" USING btree ("payroll_cycle_id","employee_id");--> statement-breakpoint
CREATE INDEX "employee_payslips_employee_idx" ON "employee_payslips" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_cycles_month_key_idx" ON "payroll_cycles" USING btree ("month_key");