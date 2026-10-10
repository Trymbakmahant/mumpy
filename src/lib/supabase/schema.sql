-- ====================================================================
-- MUMPY WATER LOGISTICS & FLEET MANAGEMENT SYSTEM
-- Supabase PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor to initialize or update tables
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

-- 3. Customers & Subscriptions (Updated for Custom Delivery Days & Old Balance)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  account_type TEXT NOT NULL DEFAULT 'Residential',
  sector TEXT NOT NULL,
  hub TEXT DEFAULT 'Main Water Plant',
  assigned_van_id TEXT REFERENCES public.vans(id) ON DELETE SET NULL,
  premises TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL DEFAULT 0,
  longitude NUMERIC(9, 6) NOT NULL DEFAULT 0,
  formatted_coordinates TEXT,
  product_tier TEXT NOT NULL DEFAULT '20L Mineral Can',
  can_quota INTEGER DEFAULT 0,
  pack_quota INTEGER DEFAULT 0,
  cadence TEXT NOT NULL DEFAULT 'Daily',
  delivery_days TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  balance_due NUMERIC(10, 2) DEFAULT 0,
  slot TEXT NOT NULL DEFAULT '07 - 10 AM',
  clean_empties INTEGER DEFAULT 0,
  held_empties INTEGER DEFAULT 0,
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  whatsapp_opt_in BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safe migrations for existing customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS delivery_days TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10, 2) DEFAULT 0;

-- 4. Deliveries & Drop-off Logs (Updated for Old Balance Breakdown & Payment State)
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name TEXT,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  van_id TEXT REFERENCES public.vans(id) ON DELETE SET NULL,
  delivered_quantity INTEGER NOT NULL DEFAULT 2,
  empties_returned INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI QR', 'Monthly Ledger', 'Credit Net-7', 'UPI Auto')),
  payment_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  old_balance_collected NUMERIC(10, 2) DEFAULT 0,
  current_delivery_paid BOOLEAN DEFAULT TRUE,
  credit_applied NUMERIC(10, 2) DEFAULT 0,
  remaining_balance NUMERIC(10, 2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Completed' CHECK (payment_status IN ('Completed', 'Pending', 'Failed', 'Settled')),
  drop_off_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Delivered' CHECK (status IN ('Delivered', 'Attempted', 'Rescheduled')),
  delivered_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safe migrations for existing deliveries table
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS old_balance_collected NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS current_delivery_paid BOOLEAN DEFAULT TRUE;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS credit_applied NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(10, 2) DEFAULT 0;

-- 5. Payment Settlements (Live Feed & Admin Ledger)
CREATE TABLE IF NOT EXISTS public.payment_settlements (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL,
  customer_id TEXT,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  area_id TEXT,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL CHECK (method IN ('UPI Auto', 'UPI QR', 'Cash', 'Credit Net-7', 'Monthly Ledger')),
  status TEXT NOT NULL DEFAULT 'Cleared' CHECK (status IN ('Cleared', 'Collected', 'Due in 5d', 'Pending', 'Settled')),
  units TEXT NOT NULL DEFAULT '2 x 20L Cans',
  delivered_count INTEGER DEFAULT 2,
  empties_returned INTEGER DEFAULT 2,
  old_balance_settled NUMERIC(10, 2) DEFAULT 0,
  time_display TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safe migrations for existing payment_settlements table
ALTER TABLE public.payment_settlements ADD COLUMN IF NOT EXISTS old_balance_settled NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.payment_settlements ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 2;
ALTER TABLE public.payment_settlements ADD COLUMN IF NOT EXISTS empties_returned INTEGER DEFAULT 2;

-- 6. Area Clients & Delivery History (For Admin Heatmap & Area History View)
CREATE TABLE IF NOT EXISTS public.area_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Residential',
  area_id TEXT NOT NULL,
  area_name TEXT NOT NULL,
  route_tag TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  daily_bottles INTEGER NOT NULL DEFAULT 50,
  last_delivery_time TEXT NOT NULL DEFAULT 'Today, 10:00 AM',
  payment_method TEXT NOT NULL DEFAULT 'UPI QR',
  balance_due NUMERIC(10, 2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Cleared' CHECK (payment_status IN ('Cleared', 'Collected', 'Pending', 'Due in 5d', 'Settled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.area_client_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT REFERENCES public.area_clients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  delivered INTEGER NOT NULL DEFAULT 0,
  empties_returned INTEGER NOT NULL DEFAULT 0,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Settled' CHECK (status IN ('Settled', 'Pending', 'Auto-Debited')),
  invoice_no TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'UPI QR',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Financial & Daily Operations Ledger
CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  gross_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cash_collected NUMERIC(12, 2) NOT NULL DEFAULT 0,
  upi_collected NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ledger_billed NUMERIC(12, 2) NOT NULL DEFAULT 0,
  old_dues_recovered NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bottles_delivered INTEGER NOT NULL DEFAULT 0,
  jars_delivered INTEGER NOT NULL DEFAULT 0,
  active_vans_count INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safe migrations for financial_records
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS old_dues_recovered NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_client_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated and anon users in demo
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public vans read" ON public.vans FOR SELECT USING (true);
CREATE POLICY "Public customers read" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Public customers insert" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public customers update" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Public deliveries read" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Public deliveries insert" ON public.deliveries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public settlements read" ON public.payment_settlements FOR SELECT USING (true);
CREATE POLICY "Public settlements insert" ON public.payment_settlements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public settlements update" ON public.payment_settlements FOR UPDATE USING (true);
CREATE POLICY "Public area_clients read" ON public.area_clients FOR SELECT USING (true);
CREATE POLICY "Public area_clients insert" ON public.area_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public area_clients update" ON public.area_clients FOR UPDATE USING (true);
CREATE POLICY "Public area_history read" ON public.area_client_history FOR SELECT USING (true);
CREATE POLICY "Public area_history insert" ON public.area_client_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public financial read" ON public.financial_records FOR SELECT USING (true);
CREATE POLICY "Public financial insert" ON public.financial_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Public financial update" ON public.financial_records FOR UPDATE USING (true);

-- Unique Constraints: Anti-Duplication Enforcement
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique ON public.customers (phone);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON public.profiles (email);
CREATE UNIQUE INDEX IF NOT EXISTS payment_settlements_invoice_unique ON public.payment_settlements (invoice_no);

-- Seed Data: Sample Admin and Delivery Boys
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

-- Seed Data: Sample Payment Settlements
INSERT INTO public.payment_settlements (id, invoice_no, client_name, location, area_id, amount, method, status, units, old_balance_settled, time_display)
VALUES
  ('settle-01', 'INV-9821', 'Infosys Cafeteria #2', 'IT Park • INV-9821', 'area-01', 4200, 'UPI Auto', 'Cleared', '140 Cans', 0, '14:24 PM'),
  ('settle-02', 'INV-9820', 'Aura Mart & General Store', 'High Street • INV-9820', 'area-04', 1850, 'Cash', 'Collected', '60 Bottles', 0, '13:58 PM'),
  ('settle-03', 'INV-9819', 'Apex Heart Institute', 'Civil Lines • INV-9819', 'area-03', 6400, 'UPI QR', 'Cleared', '210 Cans', 0, '13:12 PM'),
  ('settle-04', 'INV-9818', 'Lakeview Society Tower C', 'Lakeview • INV-9818', 'area-02', 3000, 'Credit Net-7', 'Due in 5d', '100 Jars', 0, '12:45 PM'),
  ('settle-05', 'INV-9817', 'Engineering Faculty Mess', 'University • INV-9817', 'area-05', 2100, 'UPI QR', 'Cleared', '70 Jars', 0, '11:30 AM'),
  ('settle-06', 'INV-9816', 'Sharma Residency - Flat 402', 'IT Corridor • INV-9816', 'area-01', 240, 'UPI QR', 'Cleared', '2 x 20L Cans', 100, '10:15 AM')
ON CONFLICT (invoice_no) DO NOTHING;
