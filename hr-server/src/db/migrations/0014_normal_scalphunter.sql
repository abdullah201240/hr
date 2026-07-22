CREATE TABLE "festival_bonus_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"min_service_months" integer NOT NULL,
	"max_service_months" integer NOT NULL,
	"bonus_percentage" double precision NOT NULL,
	"is_pro_rata" boolean DEFAULT false NOT NULL,
	"description" varchar(255)
);
