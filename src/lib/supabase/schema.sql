-- ====================================================================
-- MUMPY WATER LOGISTICS & FLEET MANAGEMENT SYSTEM
-- Supabase PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor to initialize tables & data
-- ====================================================================

-- 1. Profiles (Users & Roles: admin | driver)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  phone TEXT,
  avatar_url TEXT,
  assigned_van_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Fleet Vans
CREATE TABLE IF NOT EXISTS public.vans (
  id TEXT PRIMARY KEY,
  plate_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  route_sector TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('In Transit', 'Critical Stock', 'Refueling', 'Idle')),
  initial_load INTEGER NOT NULL DEFAULT 160,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  remaining_stock INTEGER NOT NULL DEFAULT 160,
  speed_kmh NUMERIC(4, 1) DEFAULT 24.5,
  latitude NUMERIC(9, 6) DEFAULT 18.5204,
  longitude NUMERIC(9, 6) DEFAULT 73.8567,
  last_gps_update TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Customers & Subscriptions
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('Residential', 'Office / B2B')),
  sector TEXT NOT NULL,
  hub TEXT DEFAULT 'Main Water Plant',
  assigned_van_id TEXT REFERENCES public.vans(id) ON DELETE SET NULL,
  premises TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  formatted_coordinates TEXT,
  product_tier TEXT NOT NULL,
  can_quota INTEGER DEFAULT 0,
  pack_quota INTEGER DEFAULT 0,
  cadence TEXT NOT NULL DEFAULT 'Daily',
  slot TEXT NOT NULL DEFAULT '07 - 10 AM',
  clean_empties INTEGER DEFAULT 0,
  held_empties INTEGER DEFAULT 0,
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  whatsapp_opt_in BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Suspended')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Deliveries & Drop-off Logs
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  van_id TEXT REFERENCES public.vans(id) ON DELETE SET NULL,
  delivered_quantity INTEGER NOT NULL,
  empties_returned INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI QR', 'Monthly Ledger')),
  payment_amount NUMERIC(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Completed' CHECK (payment_status IN ('Completed', 'Pending', 'Failed')),
  drop_off_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Delivered' CHECK (status IN ('Delivered', 'Attempted', 'Rescheduled')),
  delivered_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Financial & Daily Operations Ledger
CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  gross_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cash_collected NUMERIC(12, 2) NOT NULL DEFAULT 0,
  upi_collected NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ledger_billed NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bottles_delivered INTEGER NOT NULL DEFAULT 0,
  jars_delivered INTEGER NOT NULL DEFAULT 0,
  active_vans_count INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated and anon users in demo
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public vans read" ON public.vans FOR SELECT USING (true);
CREATE POLICY "Public customers read" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Public deliveries read" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Public deliveries insert" ON public.deliveries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public customers insert" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public financial read" ON public.financial_records FOR SELECT USING (true);

-- Unique Constraints: Anti-Duplication Enforcement
-- Ensures no duplicate registration can occur for customers or drivers
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique ON public.customers (phone);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON public.profiles (email);

-- Seed Data: Sample Admin and Delivery Boys (2 Drivers + 1 Admin)
INSERT INTO public.profiles (email, full_name, role, phone, assigned_van_id)
VALUES 
  ('admin@mumpywater.com', 'Operations Hub Admin', 'admin', '+91 98220 11990', NULL),
  ('driver1@mumpywater.com', 'Rajesh Patil (Driver 1)', 'driver', '+91 98230 45892', 'van-02'),
  ('driver2@mumpywater.com', 'Suresh Kumar (Driver 2)', 'driver', '+91 98901 12345', 'van-01'),
  ('rajesh.patil@mumpywater.com', 'Rajesh Patil', 'driver', '+91 98230 45892', 'van-02'),
  ('suresh.kumar@mumpywater.com', 'Suresh Kumar', 'driver', '+91 98901 12345', 'van-01')
ON CONFLICT (email) DO NOTHING;

-- Seed Data: Initial Fleet Vans
INSERT INTO public.vans (id, plate_number, driver_name, route_sector, status, initial_load, delivered_count, remaining_stock, speed_kmh, latitude, longitude)
VALUES
  ('van-01', 'MH-12-BR-3041', 'Suresh Kumar', 'Sector 14 & 15', 'In Transit', 160, 94, 66, 26.4, 18.5312, 73.8421),
  ('van-02', 'MH-12-BR-3042', 'Rajesh Patil', 'IT Corridor - Phase 2', 'Critical Stock', 180, 172, 8, 18.2, 18.5204, 73.8567),
  ('van-03', 'MH-12-BR-3043', 'Amit Varma', 'Lakeview Residential', 'In Transit', 140, 60, 80, 31.0, 18.5441, 73.8690),
  ('van-04', 'MH-12-BR-3044', 'Ramesh Patil', 'Civil Lines & Hospitals', 'In Transit', 150, 110, 40, 22.8, 18.5120, 73.8340)
ON CONFLICT (id) DO NOTHING;
