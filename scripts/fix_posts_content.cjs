const { Client } = require('pg');
const db = new Client({
  host: 'db.cytmyitrqcdfodzgvmns.supabase.co',
  port: 5432, database: 'postgres', user: 'postgres',
  password: 'FFuDWhhHYtSa0kBv', ssl: { rejectUnauthorized: false }
});
async function main() {
  await db.connect();
  // Replace literal \r\n and \n text with actual newlines
  const { rowCount } = await db.query(`
    UPDATE public.posts
    SET content = replace(replace(content, '\\r\\n', E'\\n'), '\\n', E'\\n')
    WHERE content LIKE '%\\r\\n%' OR content LIKE '%\\n%'
  `);
  console.log('Updated rows:', rowCount);
  const { rows } = await db.query('SELECT id, LEFT(content, 100) as preview FROM public.posts');
  console.log('Preview:', rows[0]?.preview);
  await db.end();
}
main().catch(console.error);
