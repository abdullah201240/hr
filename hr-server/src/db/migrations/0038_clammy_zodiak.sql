INSERT INTO "notifications" ("id", "created_at", "updated_at", "recipient_id", "module", "category", "priority", "title", "message", "is_read")
SELECT "id", "created_at", "updated_at", "employee_id", 'tasks', 'assignment', 'normal', "title", "message", "is_read"
FROM "task_notifications";

DROP TABLE "task_notifications" CASCADE;