const fs = require('fs');
const sql = fs.readFileSync('C:/xampp/htdocs/webrepair_d11a/repair_d11a.sql', 'utf8');

function getValuesBlock(sql, tableName) {
  const marker = 'INSERT INTO `' + tableName + '`';
  const idx = sql.indexOf(marker);
  if (idx === -1) return null;
  const vIdx = sql.indexOf('VALUES', idx);
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

const raw = getValuesBlock(sql, 'posts');
const rows = parseRows(raw);
console.log('Post rows count:', rows.length);
const r = rows[0];
// Count top-level commas
let d = 0, s = false, b = false, commas = 0;
for (const ch of r) {
  if (b) { b = false; continue; }
  if (ch === '\\') { b = true; continue; }
  if (ch === "'") { s = !s; continue; }
  if (!s && ch === '(') d++;
  if (!s && ch === ')') d--;
  if (!s && d === 1 && ch === ',') commas++;
}
console.log('Top-level commas:', commas, '(should be 5 for 6 columns)');
console.log('Last 80 chars of row:', JSON.stringify(r.slice(-80)));
console.log('First 80 chars of row:', JSON.stringify(r.slice(0, 80)));

// Test transform
const transformed = r.replace(/, \d+, ('20\d\d-)/, ', NULL, $1');
console.log('\nTransformed last 80:', JSON.stringify(transformed.slice(-80)));
// Count commas again
d = 0; s = false; b = false; commas = 0;
for (const ch of transformed) {
  if (b) { b = false; continue; }
  if (ch === '\\') { b = true; continue; }
  if (ch === "'") { s = !s; continue; }
  if (!s && ch === '(') d++;
  if (!s && ch === ')') d--;
  if (!s && d === 1 && ch === ',') commas++;
}
console.log('Transformed top-level commas:', commas);
