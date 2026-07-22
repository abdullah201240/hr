INSERT INTO "leave_types" ("id", "name", "icon", "color", "days", "paid", "carry_forward", "max_carry_over_days", "requires_approval", "requires_document", "description", "is_active")
VALUES
  (gen_random_uuid(), 'Late Arrival', 'Clock', 'bg-amber-500', 100, true, false, 0, true, false, 'Request for late arrival or check-in permission', true)
ON CONFLICT ("name") DO NOTHING;
