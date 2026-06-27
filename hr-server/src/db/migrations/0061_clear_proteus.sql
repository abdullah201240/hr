CREATE TABLE "asset_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"asset_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"employee_id" uuid,
	"action_by_id" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"asset_tag" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"serial_number" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"model" varchar(255),
	"purchase_date" date,
	"cost" double precision DEFAULT 0 NOT NULL,
	"condition" varchar(50) DEFAULT 'New' NOT NULL,
	"status" varchar(50) DEFAULT 'Available' NOT NULL,
	"assigned_to_id" uuid,
	"assigned_at" timestamp with time zone,
	"return_due_date" timestamp with time zone,
	"remarks" text,
	CONSTRAINT "assets_asset_tag_unique" UNIQUE("asset_tag"),
	CONSTRAINT "assets_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_action_by_id_employees_id_fk" FOREIGN KEY ("action_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_assigned_to_id_employees_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;