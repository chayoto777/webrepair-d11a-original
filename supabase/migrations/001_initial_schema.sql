-- ============================================================
-- Supabase Migration: Initial Schema for webrepair-d11a
-- วิธีใช้: Copy SQL นี้ไปวางใน Supabase SQL Editor แล้วกด Run
-- ============================================================

-- -------------------------------------------------------
-- 1. USERS TABLE (เชื่อมกับ Supabase Auth)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT NOT NULL,
  phone_number TEXT,
  affiliation TEXT DEFAULT 'โครงการวิจัยและพัฒนาจรวดหลายลำกล้องนำวิถี (D11A)',
  rank TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'mechanic')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_initial_setup_complete BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 2. TRIGGER: สร้าง user profile อัตโนมัติตอน signup
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
    COALESCE(NEW.raw_user_meta_data->>'affiliation', 'โครงการวิจัยและพัฒนาจรวดหลายลำกล้องนำวิถี (D11A)')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRIGGER: อัปเดต is_verified เมื่อ email confirmed
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users SET is_verified = TRUE WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmed();

-- -------------------------------------------------------
-- 3. VEHICLES TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
  id BIGSERIAL PRIMARY KEY,
  vehicle_name TEXT NOT NULL,
  license_plate TEXT,
  vehicle_image_path TEXT,
  project_affiliation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 4. PARTS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parts (
  id BIGSERIAL PRIMARY KEY,
  part_id TEXT NOT NULL,
  part_name_en TEXT NOT NULL,
  part_name_th TEXT NOT NULL,
  part_text_en TEXT,
  part_text_th TEXT,
  part_image_path TEXT,
  part_video_path TEXT,
  part_sound_path TEXT,
  quantity INT NOT NULL DEFAULT 0,
  standard_lifespan_days INT DEFAULT 365,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 5. VEHICLE_PARTS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_parts (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT REFERENCES public.vehicles(id) ON DELETE CASCADE,
  part_id BIGINT REFERENCES public.parts(id) ON DELETE SET NULL,
  install_date DATE NOT NULL,
  last_maintenance_date DATE,
  status TEXT NOT NULL DEFAULT 'good' CHECK (status IN ('good', 'warning', 'expired', 'broken')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 6. MAINTENANCE_REQUESTS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id BIGSERIAL PRIMARY KEY,
  vehicle_part_id BIGINT REFERENCES public.vehicle_parts(id) ON DELETE SET NULL,
  reported_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  report_details TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','in_progress','requisitioning','repairing','awaiting_approval','completed','rejected')
  ),
  admin_notes TEXT,
  image_path TEXT,
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 7. PART_REQUISITIONS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.part_requisitions (
  id BIGSERIAL PRIMARY KEY,
  maintenance_request_id BIGINT REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  part_id BIGINT REFERENCES public.parts(id) ON DELETE SET NULL,
  quantity_requested INT NOT NULL DEFAULT 1,
  requested_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- -------------------------------------------------------
-- 8. POSTS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image_path TEXT,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  project_affiliation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 9. GENERAL_REQUESTS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.general_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_requests ENABLE ROW LEVEL SECURITY;

-- Users: ดูได้ทุกคนที่ล็อกอิน, แก้ไขได้เฉพาะตัวเอง
CREATE POLICY "users_select" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Vehicles: ดูได้ทุกคน, แก้ไขได้เฉพาะ admin
CREATE POLICY "vehicles_select" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles_all_admin" ON public.vehicles FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin'));

-- Parts: ดูได้ทุกคน, แก้ไขได้เฉพาะ admin/mechanic
CREATE POLICY "parts_select" ON public.parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "parts_all_admin" ON public.parts FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'mechanic'));

-- Vehicle Parts: ดูได้ทุกคน, แก้ไขได้เฉพาะ admin/mechanic
CREATE POLICY "vehicle_parts_select" ON public.vehicle_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicle_parts_all_staff" ON public.vehicle_parts FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'mechanic'));

-- Maintenance Requests: ดูและสร้างได้ทุกคน, แก้ไข/ลบได้เฉพาะ admin/mechanic
CREATE POLICY "maintenance_select" ON public.maintenance_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "maintenance_insert" ON public.maintenance_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "maintenance_update_staff" ON public.maintenance_requests FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'mechanic'));

-- Part Requisitions: ดูได้ทุกคน, แก้ไขได้เฉพาะ admin/mechanic
CREATE POLICY "requisitions_select" ON public.part_requisitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "requisitions_insert" ON public.part_requisitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "requisitions_update_staff" ON public.part_requisitions FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'mechanic'));

-- Posts: ดูได้ทุกคน (รวมไม่ล็อกอิน), แก้ไขได้เฉพาะ admin
CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_all_admin" ON public.posts FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- General Requests: ดูได้เฉพาะเจ้าของและ admin, สร้างได้ทุกคน
CREATE POLICY "general_requests_select" ON public.general_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "general_requests_insert" ON public.general_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "general_requests_update_admin" ON public.general_requests FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
