const { Client } = require('pg');

const client = new Client({
  host: 'db.cytmyitrqcdfodzgvmns.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'FFuDWhhHYtSa0kBv',
  ssl: { rejectUnauthorized: false }
});

const posts = [
  {
    id: 1,
    title: 'แจ้งเพื่อทราบ: รายงานผลการทดสอบระบบบริหารจัดการยานพาหนะ D11A เฟส 1.2',
    featured_image_path: 'uploads/post_69129e29d671e0.74055660.jpg',
    content: `เรียน ผู้ดูแลระบบและผู้ใช้งานทุกท่าน,

ข้อความนี้จัดทำขึ้นเพื่อเป็น ข้อมูลทดสอบระบบการโพสต์ประกาศ (Post Content Stress Test) โดยมีวัตถุประสงค์หลักในการประเมินความสามารถในการแสดงผลของเนื้อหาจำนวนมากและข้อความที่มีรูปแบบพิเศษ (เช่น การใช้รายการ, การจัดรูปแบบย่อหน้า) ในสภาพแวดล้อมจริงของระบบ โปรดละเว้นการดำเนินการใด ๆ ตามเนื้อหานี้ เนื่องจากไม่ใช่ประกาศจริง

1. ผลการประเมินเบื้องต้น (Phase 1.2 Evaluation Summary):

ความเสถียรของฐานข้อมูล: การเชื่อมต่อและการดึงข้อมูลผ่าน PHP/SQL มีความเสถียรดีเยี่ยม (Status: Stable)

การแสดงผลบนหน้าจอ: Layout โดยรวมของหน้า Admin และหน้าผู้ใช้ ยังคงรักษา ธีมทหาร (Military Theme) ได้อย่างสมบูรณ์แบบตามที่กำหนดไว้

การจัดการสิทธิ์: ระบบยืนยันการกรองข้อมูลตามสังกัดโครงการ (affiliation) ของ Admin ในส่วนต่าง ๆ เช่น การจัดการผู้ใช้งาน, ยานพาหนะ, คำร้องซ่อมบำรุง, และ ใบเบิกอะไหล่ ได้อย่างถูกต้อง

2. ข้อสังเกตสำหรับการพัฒนาในอนาคต:

เพิ่มความละเอียดในการบันทึก Log การเข้าถึงสำหรับผู้ดูแลระบบระดับสูง (Super Admin)

ปรับปรุงความเร็วในการโหลดตารางที่มีข้อมูลขนาดใหญ่ (Optimization for Polling Data)

ทดสอบการลบไฟล์ที่แนบมากับคำร้องแจ้งซ่อมซ้ำอีกครั้ง เพื่อยืนยันว่า Path ในเซิร์ฟเวอร์ถูกลบอย่างสมบูรณ์

ย้ำเตือนอีกครั้ง: ห้ามดำเนินการใด ๆ ตามเนื้อหานี้ ข้อมูลข้างต้นเป็นเพียงชุดข้อมูลจำลองเพื่อใช้ในการทดสอบประสิทธิภาพสูงสุดของช่องข้อมูลประกาศของระบบ D11A เท่านั้น

ลงชื่อ: ทีมพัฒนาและทดสอบระบบบริหารจัดการยานพาหนะ วันที่: 11 พฤศจิกายน 2568 รหัสการทดสอบ: TST_11112568_LGTX`,
    author_id: null,
    created_at: '2025-11-11 02:23:37'
  }
];

async function main() {
  await client.connect();
  console.log('Connected!');

  for (const post of posts) {
    await client.query(
      `INSERT INTO public.posts (id, title, featured_image_path, content, author_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
      [post.id, post.title, post.featured_image_path, post.content, post.author_id, post.created_at]
    );
    console.log('Inserted post:', post.id, post.title.substring(0, 40));
  }

  await client.query(`SELECT setval('public.posts_id_seq', (SELECT MAX(id) FROM public.posts))`);
  console.log('Done!');
  await client.end();
}

main().catch(console.error);
