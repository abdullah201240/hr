CREATE TABLE "loan_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"loan_id" uuid NOT NULL,
	"payslip_id" uuid,
	"amount" double precision NOT NULL,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount" double precision NOT NULL,
	"reason" text NOT NULL,
	"interest_rate" double precision DEFAULT 0 NOT NULL,
	"term_months" integer NOT NULL,
	"monthly_installment" double precision NOT NULL,
	"remaining_balance" double precision NOT NULL,
	"status" varchar(30) DEFAULT 'Pending' NOT NULL,
	"approved_by_id" uuid,
	"approved_at" timestamp with time zone,
	"disbursed_by_id" uuid,
	"disbursed_at" timestamp with time zone,
	"remarks" text
);
--> statement-breakpoint
ALTER TABLE "loan_payments" ADD CONSTRAINT "loan_payments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_payments" ADD CONSTRAINT "loan_payments_payslip_id_employee_payslips_id_fk" FOREIGN KEY ("payslip_id") REFERENCES "public"."employee_payslips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_id_employees_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_disbursed_by_id_employees_id_fk" FOREIGN KEY ("disbursed_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;