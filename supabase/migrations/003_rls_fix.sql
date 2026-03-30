-- ============================================================
-- Migration 003: Fix RLS for vehicle_parts
-- อนุญาตให้ทุกคนที่ล็อกอินแล้วเพิ่ม/ลบอะไหล่ในรถได้
-- วิธีใช้: Copy SQL นี้ไปวางใน Supabase SQL Editor แล้วกด Run
-- ============================================================

-- ลบ policy เดิมที่จำกัดเฉพาะ admin/mechanic
DROP POLICY IF EXISTS "vehicle_parts_all_staff" ON public.vehicle_parts;

-- เพิ่มอะไหล่: ทุกคนที่ล็อกอินได้
CREATE POLICY "vehicle_parts_insert_all" ON public.vehicle_parts
  FOR INSERT TO authenticated WITH CHECK (true);

-- ลบอะไหล่: ทุกคนที่ล็อกอินได้
CREATE POLICY "vehicle_parts_delete_all" ON public.vehicle_parts
  FOR DELETE TO authenticated USING (true);

-- อัปเดตอะไหล่: เฉพาะ admin/mechanic
CREATE POLICY "vehicle_parts_update_staff" ON public.vehicle_parts
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'mechanic'));
