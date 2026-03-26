const { Client } = require('pg');

const db = new Client({
  host: 'db.cytmyitrqcdfodzgvmns.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'FFuDWhhHYtSa0kBv',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await db.connect();

  await db.query(`
    UPDATE public.vehicles SET
      vehicle_name = 'รถฐานยิงจรวดหลายลำกล้องอเนกประสงค์อัตราจร D11A',
      license_plate = 'D11A-001',
      vehicle_image_path = 'https://cytmyitrqcdfodzgvmns.supabase.co/storage/v1/object/public/uploads/D11A.jpg',
      project_affiliation = 'โครงการวิจัยและพัฒนาจรวดหลายลำกล้องนำวิถี (D11A)'
    WHERE id = 6
  `);

  const { rows } = await db.query('SELECT id, vehicle_name, license_plate FROM public.vehicles');
  console.log('Updated:', rows);
  await db.end();
}

main().catch(console.error);
