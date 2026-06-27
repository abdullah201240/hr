import fs from 'fs';
import postgres from 'postgres';

const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    envVars[key] = value;
  }
});

const sql = postgres(envVars.DATABASE_URL!, { max: 1 });

async function run() {
  const results = await sql`
    INSERT INTO "leave_types" ("id", "name", "icon", "color", "days", "paid", "carry_forward", "max_carry_over_days", "requires_approval", "requires_document", "description", "is_active")
    VALUES
      (gen_random_uuid(), 'Late Arrival', 'Clock', 'bg-amber-500', 100, true, false, 0, true, false, 'Request for late arrival or check-in permission', true)
    ON CONFLICT ("name") DO NOTHING
    RETURNING id, name
  `;
  console.log(results);
  await sql.end();
}

run().catch(console.error);
