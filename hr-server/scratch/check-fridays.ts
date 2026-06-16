import 'dotenv/config';
import postgres from 'postgres';

async function check() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const logs = await sql`
      SELECT date, status, notes FROM attendance_logs 
      WHERE date >= '2026-06-01'::date AND date <= '2026-06-30'::date
      ORDER BY date ASC;
    `;
    console.log('June 2026 Logs:');
    for (const log of logs) {
      const dateObj = new Date(log.date);
      const day = dateObj.getDay();
      const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`Date: ${log.date.toISOString().split('T')[0]} (${DAY_NAMES[day]}) -> Status: ${log.status}, Notes: ${log.notes}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

check();
