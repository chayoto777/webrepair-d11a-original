const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'db.cytmyitrqcdfodzgvmns.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'FFuDWhhHYtSa0kBv',
  ssl: { rejectUnauthorized: false }
});

// Parse individual row values from VALUES block
function parseRows(valuesSql) {
  const rows = [];
  let depth = 0, cur = '', inStr = false, bs = false, inRow = false;
  for (let i = 0; i < valuesSql.length; i++) {
    const ch = valuesSql[i];
    if (bs) { if (inRow) cur += ch; bs = false; continue; }
    if (ch === '\\') { if (inRow) cur += ch; bs = true; continue; }
    if (ch === "'" && !bs) { inStr = !inStr; if (inRow) cur += ch; continue; }
    if (!inStr && ch === '(' && depth === 0) { depth = 1; inRow = true; cur = '('; continue; }
    if (!inStr && ch === '(' && depth > 0) { depth++; cur += ch; continue; }
    if (!inStr && ch === ')') {
      depth--;
      if (inRow) cur += ch;
      if (depth === 0 && inRow) { rows.push(cur); cur = ''; inRow = false; }
      continue;
    }
    if (inRow) cur += ch;
  }
  return rows;
}

function getValuesBlock(sql, tableName) {
  const marker = 'INSERT INTO `' + tableName + '`';
  const idx = sql.indexOf(marker);
  if (idx === -1) return null;
  const vIdx = sql.indexOf('VALUES', idx);
  if (vIdx === -1) return null;
  // Find end of VALUES block (semicolon at depth 0)
  let end = sql.length, depth = 0, inStr = false, bs = false;
  for (let i = vIdx + 6; i < sql.length; i++) {
    const ch = sql[i];
    if (bs) { bs = false; continue; }
    if (ch === '\\') { bs = true; continue; }
    if (ch === "'") { inStr = !inStr; continue; }
    if (!inStr && ch === '(') depth++;
    if (!inStr && ch === ')') depth--;
    if (!inStr && depth === 0 && ch === ';') { end = i; break; }
  }
  return sql.substring(vIdx + 6, end).trim();
}

async function insertRows(tableName, columns, rawValues, transform) {
  if (!rawValues) { console.log('SKIP:', tableName, '(no data)'); return; }
  const rows = parseRows(rawValues);
  let ok = 0, fail = 0;
  for (const row of rows) {
    let r = row;
    if (transform) r = transform(r);
    // MySQL \' → PostgreSQL ''
    r = r.replace(/\\'/g, "''");
    // Remove trailing updateTime: , 'YYYY-MM-DD HH:MM:SS')
    r = r.replace(/,\s*'[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'\s*\)$/, ')');
    const stmt = `INSERT INTO public.${tableName} (${columns}) VALUES ${r} ON CONFLICT (id) DO NOTHING`;
    try {
      await client.query(stmt);
      ok++;
    } catch (err) {
      fail++;
      console.error(`  ERR [${tableName}] id=${r.match(/^\((\d+)/)?.[1]}:`, err.message.substring(0, 120));
    }
  }
  console.log(`OK: ${tableName} — ${ok} inserted, ${fail} failed`);
}

async function main() {
  await client.connect();
  console.log('Connected!\n');

  const sql = fs.readFileSync('C:/xampp/htdocs/webrepair_d11a/repair_d11a.sql', 'utf8');

  await insertRows('vehicles',
    'id, project_affiliation, vehicle_name, license_plate, vehicle_image_path',
    getValuesBlock(sql, 'vehicles'));

  await insertRows('parts',
    'id, part_id, quantity, standard_lifespan_days, part_name_en, part_name_th, part_text_en, part_text_th, part_image_path, part_video_path, part_sound_path',
    getValuesBlock(sql, 'parts'));

  await insertRows('posts',
    'id, title, featured_image_path, content, author_id, created_at',
    getValuesBlock(sql, 'posts'),
    (r) => r.replace(/, \d+, ('20\d\d-)/, ', NULL, $1'));

  await insertRows('general_requests',
    'id, user_id, request_type, subject, details, status, created_at, admin_notes',
    getValuesBlock(sql, 'general_requests'),
    (r) => r.replace(/^\((\d+), \d+,/, '($1, NULL,'));

  // Reset sequences
  for (const t of ['vehicles', 'parts', 'posts', 'general_requests']) {
    await client.query(`SELECT setval('public.${t}_id_seq', COALESCE((SELECT MAX(id) FROM public.${t}), 1))`);
  }
  console.log('\nSequences reset. Done!');
  await client.end();
}

main().catch(console.error);
