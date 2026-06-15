ALTER TABLE "leave_types" ADD COLUMN "clause" varchar(50);--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "carry_forward" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "max_carry_over_days" integer;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "encashment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "encashment_percent" integer;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "is_pro_rata" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "sandwich_rule" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "comp_leave_expiry_days" integer;--> statement-breakpoint
ALTER TABLE "leave_types" ADD COLUMN "eligibility" text;
