ALTER TABLE "chat_messages" ADD COLUMN "is_edited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;