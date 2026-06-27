CREATE TABLE "provident_fund_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"month_key" varchar(10),
	"employee_contribution" double precision DEFAULT 0 NOT NULL,
	"employer_contribution" double precision DEFAULT 0 NOT NULL,
	"type" varchar(30) DEFAULT 'contribution' NOT NULL,
	"amount" double precision NOT NULL,
	"description" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provident_fund_withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount" double precision NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"remarks" text DEFAULT '' NOT NULL,
	"action_by_id" uuid,
	"action_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "provident_fund_transactions" ADD CONSTRAINT "provident_fund_transactions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provident_fund_withdrawals" ADD CONSTRAINT "provident_fund_withdrawals_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provident_fund_withdrawals" ADD CONSTRAINT "provident_fund_withdrawals_action_by_id_employees_id_fk" FOREIGN KEY ("action_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pf_transactions_employee_idx" ON "provident_fund_transactions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "pf_transactions_month_key_idx" ON "provident_fund_transactions" USING btree ("month_key");--> statement-breakpoint
CREATE INDEX "pf_withdrawals_employee_idx" ON "provident_fund_withdrawals" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "pf_withdrawals_status_idx" ON "provident_fund_withdrawals" USING btree ("status");