/**
 * Seed script for e2e testing.
 * Creates an admin user, a department, and a designation in the database.
 * Run: npx tsx test/seed-test-data.ts
 */
import 'dotenv/config';
import postgres from 'postgres';
import * as bcrypt from 'bcrypt';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function seed() {
  console.log('Seeding test data...\n');

  // 1. Create a test department
  const [dept] = await sql`
    INSERT INTO departments (id, name, code, description, is_active)
    VALUES (gen_random_uuid(), 'Engineering', 'ENG', 'Engineering Department', true)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, code
  `;
  console.log('Department:', dept);

  // 2. Create a test designation
  const [desg] = await sql`
    INSERT INTO designations (id, name, code, description, grade, is_active)
    VALUES (gen_random_uuid(), 'Software Engineer', 'SWE', 'Software Engineering', 'Mid', true)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, code
  `;
  console.log('Designation:', desg);

  // 3. Create admin user
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  const [admin] = await sql`
    INSERT INTO employees (
      employee_id, email, personal_email, password_hash,
      full_name_english, full_name_bangla, phone, personal_mobile_number,
      religion, gender, date_of_birth, blood_group, marital_status,
      nid_number, tin_number,
      father_name_english, mother_name_english,
      current_address, permanent_address,
      emergency_contact_name, emergency_contact_relation, emergency_contact_number,
      designation_id, department_id, employee_type, join_date,
      status, role, is_email_verified
    ) VALUES (
      'EMP-ADMIN-001', 'admin@company.com', 'admin.personal@company.com', ${passwordHash},
      'System Admin', 'সিস্টেম অ্যাডমিন', '01700000001', '01700000001',
      'Islam', 'Male', '1990-01-01', 'A+', 'Single',
      'NID-ADMIN-001', 'TIN-ADMIN-001',
      'Father Name', 'Mother Name',
      'Dhaka, Bangladesh', 'Dhaka, Bangladesh',
      'Emergency Contact', 'Brother', '01700000002',
      ${desg.id}, ${dept.id}, 'Full-time', '2024-01-01',
      'active', 'admin', true
    )
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      status = EXCLUDED.status
    RETURNING id, email, role, status
  `;
  console.log('Admin:', admin);

  console.log('\nSeed complete!');
  console.log('Login: admin@company.com / Admin@1234');
  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
