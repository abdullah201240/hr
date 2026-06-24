CREATE TABLE "festival_bonus_settings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"bonuses_per_year" integer DEFAULT 2 NOT NULL,
	"min_service_months" integer DEFAULT 6 NOT NULL,
	"amount_formula" varchar(50) DEFAULT 'one_month_basic' NOT NULL,
	"eligible_employee_types" jsonb DEFAULT '["Permanent"]'::jsonb NOT NULL,
	"allow_special_approval" boolean DEFAULT true NOT NULL
);
