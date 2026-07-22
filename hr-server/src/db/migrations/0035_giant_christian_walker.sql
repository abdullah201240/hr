CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_room_members" (
	"room_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_room_members_room_id_employee_id_pk" PRIMARY KEY("room_id","employee_id")
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255),
	"type" varchar(20) NOT NULL,
	"description" text DEFAULT '',
	"is_private" boolean DEFAULT false NOT NULL,
	"created_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_employees_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_created_by_id_employees_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_room_created_idx" ON "chat_messages" USING btree ("room_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_sender_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "chat_room_members_employee_idx" ON "chat_room_members" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "chat_rooms_type_idx" ON "chat_rooms" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_rooms_created_at_idx" ON "chat_rooms" USING btree ("created_at");