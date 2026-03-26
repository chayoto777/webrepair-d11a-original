const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cytmyitrqcdfodzgvmns.supabase.co';
const SERVICE_KEY = 'sb_secret_9Z7X2m4CHCUQvFnEqsb3jQ_DPTBcmq1';
const UPLOADS_DIR = 'C:/xampp/htdocs/webrepair_d11a/my_fleet/uploads';
const BUCKET = 'uploads';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const db = new Client({
  host: 'db.cytmyitrqcdfodzgvmns.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'FFuDWhhHYtSa0kBv',
  ssl: { rejectUnauthorized: false }
});

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp',
    '.gif': 'image/gif', '.svg': 'image/svg+xml'
  };
  return map[ext] || 'application/octet-stream';
}

async function main() {
  // 1. Create bucket if not exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) console.error('Bucket error:', error.message);
    else console.log('Bucket created:', BUCKET);
  } else {
    console.log('Bucket already exists:', BUCKET);
  }

  // 2. Upload all files
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });

  console.log(`\nUploading ${files.length} files...\n`);
  let ok = 0, fail = 0;

  for (const file of files) {
    const filePath = path.join(UPLOADS_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(file, fileBuffer, {
        contentType: getMimeType(file),
        upsert: true
      });
    if (error) {
      console.error('  FAIL:', file, '-', error.message);
      fail++;
    } else {
      console.log('  OK:', file);
      ok++;
    }
  }

  console.log(`\nUploaded: ${ok}, Failed: ${fail}`);

  // 3. Update DB paths to use Supabase Storage public URL
  const BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

  await db.connect();

  // Update vehicles
  const { rows: vehicles } = await db.query('SELECT id, vehicle_image_path FROM public.vehicles WHERE vehicle_image_path IS NOT NULL');
  for (const v of vehicles) {
    const filename = path.basename(v.vehicle_image_path);
    const newPath = BASE_URL + filename;
    await db.query('UPDATE public.vehicles SET vehicle_image_path = $1 WHERE id = $2', [newPath, v.id]);
  }
  console.log(`Updated ${vehicles.length} vehicles`);

  // Update parts
  const { rows: parts } = await db.query('SELECT id, part_image_path FROM public.parts WHERE part_image_path IS NOT NULL AND part_image_path != \'\'');
  for (const p of parts) {
    const filename = path.basename(p.part_image_path);
    if (!filename || filename === 'no data') continue;
    const newPath = BASE_URL + filename;
    await db.query('UPDATE public.parts SET part_image_path = $1 WHERE id = $2', [newPath, p.id]);
  }
  console.log(`Updated ${parts.length} parts`);

  // Update posts
  const { rows: posts } = await db.query('SELECT id, featured_image_path FROM public.posts WHERE featured_image_path IS NOT NULL');
  for (const p of posts) {
    const filename = path.basename(p.featured_image_path);
    const newPath = BASE_URL + filename;
    await db.query('UPDATE public.posts SET featured_image_path = $1 WHERE id = $2', [newPath, p.id]);
  }
  console.log(`Updated ${posts.length} posts`);

  await db.end();
  console.log('\nAll done!');
}

main().catch(console.error);
