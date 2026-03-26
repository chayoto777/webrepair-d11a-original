const fs = require('fs');
const content = fs.readFileSync('C:/xampp/htdocs/webrepair_d11a/repair_d11a.sql', 'utf8');
const lines = content.split('\n');

function extractBlock(tableName) {
  let block = [];
  let inside = false;
  for (const line of lines) {
    if (line.includes('INSERT INTO `' + tableName + '`')) { inside = true; block.push(line.trim()); continue; }
    if (inside) { block.push(line.trim()); if (line.trim().endsWith(';')) break; }
  }
  return block.join('\n');
}

function getValuesRows(rawSql) {
  const idx = rawSql.indexOf('VALUES');
  return rawSql.substring(idx + 6).trim();
}

// Parse rows from VALUES block (handles nested parens/strings)
function parseRows(valuesSql) {
  const rows = [];
  let depth = 0, cur = '', inStr = false, bs = false;
  for (let i = 0; i < valuesSql.length; i++) {
    const ch = valuesSql[i];
    if (bs) { cur += ch; bs = false; continue; }
    if (ch === '\\') { cur += ch; bs = true; continue; }
    if (ch === "'" && !bs) { inStr = !inStr; cur += ch; continue; }
    if (!inStr && ch === '(') { depth++; cur += ch; continue; }
    if (!inStr && ch === ')') {
      depth--; cur += ch;
      if (depth === 0) { rows.push(cur.trim()); cur = ''; }
      continue;
    }
    cur += ch;
  }
  return rows;
}

let out = `-- ============================================================
-- Seed Data: All tables from MySQL (excluding users)
-- วางใน Supabase SQL Editor แล้วกด Run
-- ============================================================

`;

// --- VEHICLES ---
const vRaw = getValuesRows(extractBlock('vehicles'));
out += `INSERT INTO public.vehicles (id, project_affiliation, vehicle_name, license_plate, vehicle_image_path) OVERRIDING SYSTEM VALUE\nVALUES\n${vRaw}\n\n`;

// --- PARTS (ตัด updateTime ออก - คอลัมน์สุดท้าย) ---
let pRaw = getValuesRows(extractBlock('parts'));
pRaw = pRaw.replace(/,\s*'[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'\)/g, ')');
out += `INSERT INTO public.parts (id, part_id, quantity, standard_lifespan_days, part_name_en, part_name_th, part_text_en, part_text_th, part_image_path, part_video_path, part_sound_path) OVERRIDING SYSTEM VALUE\nVALUES\n${pRaw}\n\n`;

// --- POSTS (author_id column -> NULL เพราะ users ไม่ได้ import) ---
const postRows = parseRows(getValuesRows(extractBlock('posts')));
// format: (id, title, img, content, author_id_int, created_at)
// replace 5th col (author_id integer) with NULL
const fixedPostRows = postRows.map(row => {
  return row.replace(/, (\d+), ('20\d\d-)/, ', NULL, $2');
});
out += `INSERT INTO public.posts (id, title, featured_image_path, content, author_id, created_at) OVERRIDING SYSTEM VALUE\nVALUES\n${fixedPostRows.join(',\n')};\n\n`;

// --- GENERAL_REQUESTS (user_id -> NULL) ---
const grRows = parseRows(getValuesRows(extractBlock('general_requests')));
// format: (id, user_id_int, request_type, ...)
const fixedGrRows = grRows.map(row => {
  return row.replace(/^\((\d+), \d+,/, '($1, NULL,');
});
out += `INSERT INTO public.general_requests (id, user_id, request_type, subject, details, status, created_at, admin_notes) OVERRIDING SYSTEM VALUE\nVALUES\n${fixedGrRows.join(',\n')};\n\n`;

// --- RESET SEQUENCES ---
out += `-- Reset sequences\n`;
out += `SELECT setval('public.vehicles_id_seq', (SELECT MAX(id) FROM public.vehicles));\n`;
out += `SELECT setval('public.parts_id_seq', (SELECT MAX(id) FROM public.parts));\n`;
out += `SELECT setval('public.posts_id_seq', (SELECT MAX(id) FROM public.posts));\n`;
out += `SELECT setval('public.general_requests_id_seq', (SELECT MAX(id) FROM public.general_requests));\n`;

fs.writeFileSync('E:/SaveData/Work/รวม/webrepair-d11a-next/supabase/migrations/002_seed_data.sql', out, 'utf8');
console.log('Done! Posts:', fixedPostRows.length, 'GR:', fixedGrRows.length);
