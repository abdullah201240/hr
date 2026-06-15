/**
 * Seed script for initial standard leave types.
 * Run: npx tsx test/seed-leave-types.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function seed() {
  console.log('Seeding leave types...\n');

  const leaveTypes = [
    {
      name: 'Annual Leave',
      icon: 'Plane',
      color: 'bg-sky-500',
      days: 18,
      paid: true,
      carry_forward: true,
      max_carry_over: 5,
      requires_approval: true,
      requires_document: false,
      description: 'Paid time off for vacation and personal rest',
    },
    {
      name: 'Sick Leave',
      icon: 'Heart',
      color: 'bg-rose-500',
      days: 10,
      paid: true,
      carry_forward: false,
      max_carry_over: 0,
      requires_approval: true,
      requires_document: true,
      description: 'Paid leave for illness or medical appointments',
    },
    {
      name: 'Casual Leave',
      icon: 'CalendarOff',
      color: 'bg-amber-500',
      days: 5,
      paid: true,
      carry_forward: false,
      max_carry_over: 0,
      requires_approval: true,
      requires_document: false,
      description: 'Short-term leave for personal matters',
    },
    {
      name: 'Maternity Leave',
      icon: 'Baby',
      color: 'bg-pink-500',
      days: 90,
      paid: true,
      carry_forward: false,
      max_carry_over: 0,
      requires_approval: true,
      requires_document: true,
      description: 'Paid leave for new mothers (ILO standard)',
    },
    {
      name: 'Paternity Leave',
      icon: 'Users',
      color: 'bg-blue-500',
      days: 15,
      paid: true,
      carry_forward: false,
      max_carry_over: 0,
      requires_approval: true,
      requires_document: true,
      description: 'Paid leave for new fathers',
    },
    {
      name: 'Training Leave',
      icon: 'GraduationCap',
      color: 'bg-violet-500',
      days: 3,
      paid: true,
      carry_forward: true,
      max_carry_over: 3,
      requires_approval: true,
      requires_document: true,
      description: 'Paid leave for professional development',
    },
    {
      name: 'Bereavement Leave',
      icon: 'AlertCircle',
      color: 'bg-gray-500',
      days: 5,
      paid: true,
      carry_forward: false,
      max_carry_over: 0,
      requires_approval: false,
      requires_document: false,
      description: 'Paid leave for loss of immediate family member',
    },
    {
      name: 'Work From Home',
      icon: 'Home',
      color: 'bg-emerald-500',
      days: 12,
      paid: true,
      carry_forward: false,
      max_carry_over: 0,
      requires_approval: true,
      requires_document: false,
      description: 'Remote work days per year',
    },
  ];

  for (const lt of leaveTypes) {
    const [result] = await sql`
      INSERT INTO leave_types (
        id, name, icon, color, days, paid, carry_forward, max_carry_over,
        requires_approval, requires_document, description, is_active
      ) VALUES (
        gen_random_uuid(), ${lt.name}, ${lt.icon}, ${lt.color}, ${lt.days},
        ${lt.paid}, ${lt.carry_forward}, ${lt.max_carry_over}, ${lt.requires_approval},
        ${lt.requires_document}, ${lt.description}, true
      )
      ON CONFLICT (name) DO UPDATE SET
        icon = EXCLUDED.icon,
        color = EXCLUDED.color,
        days = EXCLUDED.days,
        paid = EXCLUDED.paid,
        carry_forward = EXCLUDED.carry_forward,
        max_carry_over = EXCLUDED.max_carry_over,
        requires_approval = EXCLUDED.requires_approval,
        requires_document = EXCLUDED.requires_document,
        description = EXCLUDED.description
      RETURNING id, name
    `;
    console.log('Seeded:', result);
  }

  console.log('\nSeed complete!');
  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
