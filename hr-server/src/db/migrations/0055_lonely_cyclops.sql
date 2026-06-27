ALTER TABLE "festival_bonus_settings" ADD COLUMN "salary_component" varchar(50) DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE "festival_bonus_settings" ADD COLUMN "prorata_full_service_months" integer DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE "festival_bonus_settings" ADD COLUMN "tier_rules" jsonb DEFAULT '[]'::jsonb NOT NULL;