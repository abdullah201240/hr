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
    UPDATE festival_bonus_settings
    SET eligible_employee_types = '["Full-time"]'::jsonb
    WHERE id = 'default'
    RETURNING id, eligible_employee_types
  `;
  console.log(results);
  await sql.end();
}

run().catch(console.error);
