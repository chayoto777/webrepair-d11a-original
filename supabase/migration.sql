-- =============================================
-- WebRepair D11A - Supabase Database Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text unique not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin', 'mechanic')),
  affiliation text,
  rank text,
  phone_number text,
  is_verified boolean default false,
  is_initial_setup_complete boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- 2. VEHICLES TABLE
-- =============================================
create table public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  vehicle_name text not null,
  license_plate text not null,
  vehicle_image_path text,
  project_affiliation text default 'โครงการวิจัยและพัฒนาจรวดหลายลำกล้องนำวิถี (D11A)',
  created_at timestamptz default now()
);

-- =============================================
-- 3. PARTS TABLE
-- =============================================
create table public.parts (
  id uuid primary key default uuid_generate_v4(),
  part_name_th text not null,
  part_id text,
  quantity integer not null default 0,
  standard_lifespan_days integer not null default 365,
  part_image_path text,
  part_text_th text,
  created_at timestamptz default now()
);

-- =============================================
-- 4. VEHICLE_PARTS TABLE (junction)
-- =============================================
create table public.vehicle_parts (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  part_id uuid not null references public.parts(id) on delete cascade,
  install_date date default current_date,
  status text default 'active',
  created_at timestamptz default now()
);

-- =============================================
-- 5. MAINTENANCE_REQUESTS TABLE
-- =============================================
create table public.maintenance_requests (
  id uuid primary key default uuid_generate_v4(),
  vehicle_part_id uuid not null references public.vehicle_parts(id) on delete cascade,
  reported_by_user_id uuid not null references public.users(id),
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'requisitioning', 'repairing', 'awaiting_approval', 'completed', 'rejected')),
  is_urgent boolean default false,
  image_path text,
  assigned_to_user_id uuid references public.users(id),
  admin_notes text,
  request_date date default current_date,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- =============================================
-- 6. PART_REQUISITIONS TABLE
-- =============================================
create table public.part_requisitions (
  id uuid primary key default uuid_generate_v4(),
  maintenance_request_id uuid references public.maintenance_requests(id) on delete set null,
  part_id uuid not null references public.parts(id),
  quantity_requested integer not null default 1,
  requested_by uuid not null references public.users(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- =============================================
-- 7. GENERAL_REQUESTS TABLE
-- =============================================
create table public.general_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  request_type text,
  subject text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'in_progress', 'completed', 'rejected')),
  admin_notes text,
  created_at timestamptz default now()
);

-- =============================================
-- 8. POSTS TABLE
-- =============================================
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  featured_image_path text,
  author_id uuid not null references public.users(id),
  project_affiliation text,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.parts enable row level security;
alter table public.vehicle_parts enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.part_requisitions enable row level security;
alter table public.general_requests enable row level security;
alter table public.posts enable row level security;

-- USERS: everyone can read, users can update own profile, admins can do everything
create policy "Users are viewable by authenticated users" on public.users for select to authenticated using (true);
create policy "Users can update own profile" on public.users for update to authenticated using (auth.uid() = id);
create policy "Admins can insert users" on public.users for insert to authenticated with check (true);
create policy "Admins can delete users" on public.users for delete to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- VEHICLES: everyone can read, admins can modify
create policy "Vehicles are viewable by all authenticated" on public.vehicles for select to authenticated using (true);
create policy "Admins can insert vehicles" on public.vehicles for insert to authenticated with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Admins can update vehicles" on public.vehicles for update to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete vehicles" on public.vehicles for delete to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- PARTS: everyone can read, admins can modify
create policy "Parts are viewable by all authenticated" on public.parts for select to authenticated using (true);
create policy "Admins can insert parts" on public.parts for insert to authenticated with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Admins can update parts" on public.parts for update to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- VEHICLE_PARTS: everyone can read, authenticated can insert, admins can delete
create policy "Vehicle parts are viewable by all authenticated" on public.vehicle_parts for select to authenticated using (true);
create policy "Authenticated can insert vehicle parts" on public.vehicle_parts for insert to authenticated with check (true);
create policy "Authenticated can delete vehicle parts" on public.vehicle_parts for delete to authenticated using (true);

-- MAINTENANCE_REQUESTS: users see own or assigned, admins see all
create policy "Users can view own requests" on public.maintenance_requests for select to authenticated using (
  reported_by_user_id = auth.uid()
  or assigned_to_user_id = auth.uid()
  or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Authenticated can insert requests" on public.maintenance_requests for insert to authenticated with check (true);
create policy "Assigned or admin can update requests" on public.maintenance_requests for update to authenticated using (
  assigned_to_user_id = auth.uid()
  or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete requests" on public.maintenance_requests for delete to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- PART_REQUISITIONS: requester or admin can view, mechanics can insert
create policy "Requisitions viewable by requester or admin" on public.part_requisitions for select to authenticated using (
  requested_by = auth.uid()
  or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Mechanics can insert requisitions" on public.part_requisitions for insert to authenticated with check (
  exists (select 1 from public.users where id = auth.uid() and role in ('mechanic', 'admin'))
);
create policy "Admins can update requisitions" on public.part_requisitions for update to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- GENERAL_REQUESTS: users see own, admins see all
create policy "Users can view own general requests" on public.general_requests for select to authenticated using (
  user_id = auth.uid()
  or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Authenticated can insert general requests" on public.general_requests for insert to authenticated with check (true);
create policy "Admins can update general requests" on public.general_requests for update to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete general requests" on public.general_requests for delete to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- POSTS: everyone (including anonymous) can read, admins can modify
create policy "Posts are viewable by everyone" on public.posts for select using (true);
create policy "Admins can insert posts" on public.posts for insert to authenticated with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Admins can update posts" on public.posts for update to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete posts" on public.posts for delete to authenticated using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- =============================================
-- TRIGGER: Auto-create user profile on signup
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, email, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- STORAGE BUCKET for images (optional)
-- =============================================
-- Run this if you want image upload support:
-- insert into storage.buckets (id, name, public) values ('images', 'images', true);
-- create policy "Anyone can view images" on storage.objects for select using (bucket_id = 'images');
-- create policy "Authenticated can upload images" on storage.objects for insert to authenticated with check (bucket_id = 'images');
