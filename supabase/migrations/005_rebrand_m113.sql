-- ============================================================
-- Migration 005: Rebrand from D11A to M113
-- วิธีใช้: Copy SQL นี้ไปวางใน Supabase SQL Editor แล้วกด Run
-- ============================================================

-- -------------------------------------------------------
-- 1. อัปเดต Vehicles — เปลี่ยน affiliation และชื่อรถ
-- -------------------------------------------------------
UPDATE public.vehicles
SET project_affiliation = 'โครงการรถสายพานลำเลียง M113'
WHERE project_affiliation LIKE '%D11A%'
   OR project_affiliation LIKE '%จรวดหลายลำกล้อง%';

UPDATE public.vehicles
SET vehicle_name = 'รถสายพานลำเลียง M113'
WHERE vehicle_name IN ('Surface-to-Air Missile', 'Surface');

-- -------------------------------------------------------
-- 2. อัปเดต Users — เปลี่ยน affiliation ของผู้ใช้เดิม
-- -------------------------------------------------------
UPDATE public.users
SET affiliation = 'โครงการรถสายพานลำเลียง M113'
WHERE affiliation LIKE '%D11A%'
   OR affiliation LIKE '%จรวดหลายลำกล้อง%';

-- -------------------------------------------------------
-- 3. ลบ Parts เดิม (D11A เฉพาะ) ยกเว้น guest_info
--    และเพิ่ม Parts ใหม่สำหรับ M113
-- -------------------------------------------------------
DELETE FROM public.parts
WHERE part_id NOT IN ('guest_info');

-- เพิ่ม Parts ใหม่สำหรับ M113
INSERT INTO public.parts (part_id, quantity, standard_lifespan_days, part_name_en, part_name_th, part_text_en, part_text_th, part_image_path, part_video_path, part_sound_path)
VALUES
  ('engine_m113',        1,  730, 'Engine',              'เครื่องยนต์',
   'Chrysler 75M 6-cylinder petrol engine, 215 hp. Provides propulsion for the M113 APC.',
   'เครื่องยนต์เบนซิน 6 สูบ Chrysler 75M กำลัง 215 แรงม้า ให้กำลังขับเคลื่อนแก่รถสายพาน M113',
   'no data', 'no data', 'no data'),

  ('transmission_m113',  1,  730, 'Transmission',        'ระบบส่งกำลัง',
   'Allison TX-100-1 automatic transmission with 3 forward and 1 reverse gear.',
   'เกียร์อัตโนมัติ Allison TX-100-1 มี 3 เกียร์หน้า และ 1 เกียร์ถอยหลัง',
   'no data', 'no data', 'no data'),

  ('track_m113',         2,  365, 'Track Assembly',      'ชุดสายพาน',
   'Rubber-padded steel track, providing mobility across various terrains.',
   'สายพานเหล็กหุ้มยาง ช่วยให้รถเคลื่อนที่ได้ในสภาพภูมิประเทศต่างๆ',
   'no data', 'no data', 'no data'),

  ('road_wheels_m113',  10,  365, 'Road Wheels',         'ล้อลูกกลิ้ง',
   '5 rubber-tired road wheels per side providing support along the track.',
   'ล้อลูกกลิ้งหุ้มยาง ข้างละ 5 ล้อ ทำหน้าที่รองรับน้ำหนักรถบนสายพาน',
   'no data', 'no data', 'no data'),

  ('sprocket_m113',      2,  365, 'Drive Sprocket',      'เฟืองขับสายพาน',
   'Drive sprocket transfers engine torque to the track system.',
   'เฟืองขับสายพานทำหน้าที่ถ่ายแรงบิดจากเครื่องยนต์ไปยังสายพาน',
   'no data', 'no data', 'no data'),

  ('suspension_m113',    1,  365, 'Suspension System',   'ระบบกันสะเทือน',
   'Torsion bar suspension system for smooth cross-country movement.',
   'ระบบกันสะเทือนแบบทอร์ชันบาร์ ช่วยให้การเคลื่อนที่ออฟโรดนุ่มนวลขึ้น',
   'no data', 'no data', 'no data'),

  ('hull_m113',          1, 3650, 'Hull (Armor)',         'ตัวถัง/เกราะ',
   'Welded aluminum alloy hull providing protection against small arms and shell fragments.',
   'ตัวถังเชื่อมจากอะลูมิเนียมอัลลอยด์ ป้องกันกระสุนขนาดเล็กและเศษระเบิดได้',
   'no data', 'no data', 'no data'),

  ('rear_ramp_m113',     1,  365, 'Rear Ramp',           'ประตูท้าย (แรมป์)',
   'Hydraulically operated rear ramp allowing rapid troop embarkation and debarkation.',
   'แรมป์ด้านท้ายขับเคลื่อนด้วยระบบไฮดรอลิก ช่วยให้ทหารขึ้น-ลงรถได้รวดเร็ว',
   'no data', 'no data', 'no data'),

  ('cupola_m113',        1,  730, 'Commander Cupola',    'ป้อมผู้บังคับการ',
   'Commander cupola fitted with M2 .50 caliber heavy machine gun.',
   'ป้อมผู้บังคับการติดตั้งปืนกลหนัก M2 ขนาด .50 นิ้ว',
   'no data', 'no data', 'no data'),

  ('electrical_m113',    1,  365, 'Electrical System',   'ระบบไฟฟ้า',
   '24V DC electrical system powering all vehicle electronics and lighting.',
   'ระบบไฟฟ้ากระแสตรง 24V จ่ายไฟให้กับอุปกรณ์อิเล็กทรอนิกส์และไฟส่องสว่างทั้งหมดของรถ',
   'no data', 'no data', 'no data'),

  ('cooling_m113',       1,  180, 'Cooling System',      'ระบบระบายความร้อน',
   'Engine cooling system including radiator, coolant pump, and thermostat.',
   'ระบบระบายความร้อนเครื่องยนต์ ประกอบด้วยหม้อน้ำ ปั๊มน้ำหล่อเย็น และเทอร์โมสแตต',
   'no data', 'no data', 'no data'),

  ('fuel_tank_m113',     2,  365, 'Fuel Tank',           'ถังน้ำมัน',
   'Two internal fuel tanks with total capacity of 360 liters.',
   'ถังน้ำมันภายใน 2 ถัง ความจุรวม 360 ลิตร',
   'no data', 'no data', 'no data'),

  ('battery_m113',       2,  365, 'Battery',             'แบตเตอรี่',
   '2× 12V batteries connected in series to supply 24V to all systems.',
   'แบตเตอรี่ขนาด 12V จำนวน 2 ลูก ต่อแบบอนุกรมเพื่อจ่ายไฟ 24V ให้ระบบทั้งหมด',
   'no data', 'no data', 'no data'),

  ('hatches_m113',       3,  730, 'Top Hatches',         'ฝาบนรถ',
   'Three top hatches: driver hatch, commander hatch, and rear troop hatch.',
   'ฝาบนรถ 3 ชุด ได้แก่ ฝาคนขับ ฝาผู้บังคับการ และฝาด้านท้ายสำหรับพลประจำรถ',
   'no data', 'no data', 'no data');

-- -------------------------------------------------------
-- 4. อัปเดต guest_info part ให้เป็นข้อมูล M113
-- -------------------------------------------------------
UPDATE public.parts
SET
  part_name_en = 'M113 Armored Personnel Carrier',
  part_name_th = 'รถสายพานลำเลียง M113',
  part_text_en = 'The M113 is a fully tracked armored personnel carrier (APC) that was developed and produced by FMC Corporation. The M113 was first used in combat during the Vietnam War and has been used in many conflicts since. It is one of the most widely used armored vehicles of all time, and the M113 family has been used by over 50 countries worldwide.',
  part_text_th = 'รถสายพานลำเลียง M113 เป็นยานเกราะลำเลียงพลแบบสายพาน พัฒนาและผลิตโดยบริษัท FMC Corporation ถูกใช้งานครั้งแรกในสงครามเวียดนาม และนับแต่นั้นมาก็ถูกนำไปใช้ในความขัดแย้งมากมาย นับเป็นหนึ่งในยานเกราะที่ถูกใช้งานแพร่หลายที่สุดในประวัติศาสตร์ โดยมีการใช้งานใน 50 กว่าประเทศทั่วโลก'
WHERE part_id = 'guest_info';

-- Reset sequences
SELECT setval('public.parts_id_seq', (SELECT MAX(id) FROM public.parts));
