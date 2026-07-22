INSERT INTO "leave_types" ("id", "name", "icon", "color", "days", "paid", "carry_forward", "max_carry_over_days", "requires_approval", "requires_document", "description", "is_active")
VALUES
  (gen_random_uuid(), 'Early Out', 'Clock', 'bg-orange-500', 100, true, false, 0, true, false, 'Request to leave the office early', true),
  (gen_random_uuid(), 'Movement', 'Briefcase', 'bg-indigo-500', 100, true, false, 0, true, false, 'Official duty outside the office for the day', true),
  (gen_random_uuid(), 'Travels', 'MapPin', 'bg-teal-500', 100, true, false, 0, true, false, 'Business travel or official tour', true)
ON CONFLICT ("name") DO NOTHING;
