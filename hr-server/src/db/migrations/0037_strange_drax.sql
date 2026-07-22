CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"employee_id" uuid NOT NULL,
	"disabled_modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"disabled_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"email_enabled" boolean DEFAULT false NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" varchar(5),
	"quiet_hours_end" varchar(5),
	"digest_frequency" varchar(20) DEFAULT 'realtime' NOT NULL,
	CONSTRAINT "notification_preferences_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"actor_id" uuid,
	"module" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"action_url" varchar(500),
	"actions" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"is_archived" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"dedup_key" varchar(255),
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_employees_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_employees_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notification_prefs_employee" ON "notification_preferences" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient_unread" ON "notifications" USING btree ("recipient_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient_module" ON "notifications" USING btree ("recipient_id","module","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_entity" ON "notifications" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notifications_dedup" ON "notifications" USING btree ("dedup_key");--> statement-breakpoint
CREATE INDEX "idx_notifications_expires" ON "notifications" USING btree ("expires_at");