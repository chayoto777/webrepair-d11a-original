const { Client } = require('pg');
const db = new Client({
  host: 'db.cytmyitrqcdfodzgvmns.supabase.co',
  port: 5432, database: 'postgres', user: 'postgres',
  password: 'FFuDWhhHYtSa0kBv', ssl: { rejectUnauthorized: false }
});
async function main() {
  await db.connect();
  const role = process.argv[2] || 'mechanic';
  await db.query(`UPDATE public.users SET role = $1 WHERE id = '59b904bd-171c-45a5-b977-7b52feaad0bd'`, [role]);
  const { rows } = await db.query(`SELECT email, role FROM public.users WHERE id = '59b904bd-171c-45a5-b977-7b52feaad0bd'`);
  console.log('Role updated:', rows[0]);
  await db.end();
}
main().catch(console.error);
