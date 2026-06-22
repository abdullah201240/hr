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
    SELECT p.*, e.full_name_english 
    FROM employee_payslips p
    JOIN employees e ON p.employee_id = e.id
    WHERE e.employee_id = 'EMP-ADMIN-001'
  `;
  console.log(results);
  await sql.end();
}

run().catch(console.error);
