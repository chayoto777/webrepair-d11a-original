-- ============================================================
-- Migration 004: Fix Supabase Security Warnings
-- วิธีใช้: Copy SQL นี้ไปวางใน Supabase SQL Editor แล้วกด Run
-- ============================================================

-- -------------------------------------------------------
-- 1. Fix: Function Search Path Mutable
--    เพิ่ม SET search_path = public ให้ทั้ง 2 functions
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, full_name, email, phone_number, rank, affiliation)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'rank',
    COALESCE(NEW.raw_user_meta_data->>'affiliation', 'โครงการรถสายพานลำเลียง M113')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users SET is_verified = TRUE WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- -------------------------------------------------------
-- 2. Fix: RLS Policy Always True
--    maintenance_requests — INSERT ให้ check เฉพาะ user ของตัวเอง
-- -------------------------------------------------------
DROP POLICY IF EXISTS "maintenance_insert" ON public.maintenance_requests;
CREATE POLICY "maintenance_insert" ON public.maintenance_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reported_by_user_id);

-- -------------------------------------------------------
-- 3. Fix: RLS Policy Always True
--    part_requisitions — INSERT ให้ check เฉพาะ user ของตัวเอง
-- -------------------------------------------------------
DROP POLICY IF EXISTS "requisitions_insert" ON public.part_requisitions;
CREATE POLICY "requisitions_insert" ON public.part_requisitions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by_user_id);

-- -------------------------------------------------------
-- 4. Fix: RLS Policy Always True
--    vehicle_parts INSERT/DELETE — check ว่า authenticated เท่านั้น
--    (ไม่มี user-specific column จึง scope เป็น role แทน)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "vehicle_parts_insert_all" ON public.vehicle_parts;
CREATE POLICY "vehicle_parts_insert_all" ON public.vehicle_parts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'mechanic', 'user'))
  );

DROP POLICY IF EXISTS "vehicle_parts_delete_all" ON public.vehicle_parts;
CREATE POLICY "vehicle_parts_delete_all" ON public.vehicle_parts
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'mechanic', 'user'))
  );
