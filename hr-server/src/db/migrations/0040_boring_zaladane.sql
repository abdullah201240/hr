CREATE TABLE "custom_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	CONSTRAINT "custom_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "unique_resource_action" UNIQUE("resource","action")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_key" varchar(100) NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "unique_role_permission" UNIQUE("role_key","permission_id")
);
--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "custom_role_id" uuid;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_custom_role_id_custom_roles_id_fk" FOREIGN KEY ("custom_role_id") REFERENCES "public"."custom_roles"("id") ON DELETE set null ON UPDATE no action;