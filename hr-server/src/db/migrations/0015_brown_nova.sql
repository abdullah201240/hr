CREATE TABLE "provident_fund_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"min_service_months" integer DEFAULT 12 NOT NULL,
	"employee_contribution_rate" double precision DEFAULT 10 NOT NULL,
	"employer_contribution_rate" double precision DEFAULT 10 NOT NULL,
	"contribution_frequency" varchar(50) DEFAULT 'monthly' NOT NULL,
	"calculation_basis" varchar(100) DEFAULT 'basic_salary' NOT NULL,
	"withdrawal_rules" text DEFAULT 'As per PF Trust Rules and Labour Law' NOT NULL
);
