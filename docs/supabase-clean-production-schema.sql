-- =========================================================================
-- KHADIJAH-TUL-QUBRAH BY Meer&Mus
-- Clean Production Database Schema for Supabase (No Dummy Data)
-- Project: sijfxilgezxtprswtrmx
-- =========================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/sijfxilgezxtprswtrmx
-- 2. Click on "SQL Editor" in the left navigation sidebar.
-- 3. Click "New Query", paste this entire script, and click "RUN".
-- =========================================================================

-- Enable pgcrypto / uuid extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 0. CLEAN RESET PREVIOUS INCOMPATIBLE TABLES
-- -------------------------------------------------------------------------
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.custom_requests CASCADE;
DROP TABLE IF EXISTS public.media_gallery CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- -------------------------------------------------------------------------
-- 1. PRODUCTS TABLE (Real Garment Catalog with Stitched vs Unstitched Pricing)
-- -------------------------------------------------------------------------
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Bridal Couture',
    unstitched_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stitched_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    fabric VARCHAR(255) NOT NULL,
    craft VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    gallery TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    turnaround_days VARCHAR(64) DEFAULT '14 - 28 Days',
    is_customizable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 2. MEDIA GALLERY TABLE (Photos Uploaded from Local Camera/Gallery)
-- -------------------------------------------------------------------------
CREATE TABLE public.media_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'Bridal Couture',
    uploaded_by VARCHAR(100) DEFAULT 'Admin',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 3. ORDERS TABLE (Real Client Online & Concierge Orders)
-- -------------------------------------------------------------------------
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Lahore',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(64) NOT NULL DEFAULT 'BANK_TRANSFER',
    payment_status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    order_status VARCHAR(64) NOT NULL DEFAULT 'CONFIRMED',
    production_stage VARCHAR(64) NOT NULL DEFAULT 'MEASUREMENTS_VERIFIED',
    tracking_number VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 4. ORDER ITEMS TABLE (Garment lines with Stitched/Unstitched choice)
-- -------------------------------------------------------------------------
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(64),
    stitching_option VARCHAR(32) NOT NULL DEFAULT 'STITCHED',
    size VARCHAR(64) DEFAULT 'M',
    fabric VARCHAR(255),
    craft VARCHAR(255),
    price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 5. CUSTOM REQUESTS TABLE (Bespoke "Create Your Own Dress" Commissions)
-- -------------------------------------------------------------------------
CREATE TABLE public.custom_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    customer_email VARCHAR(255),
    silhouette VARCHAR(100) NOT NULL,
    fabric VARCHAR(100) NOT NULL,
    craft VARCHAR(100) NOT NULL,
    colour VARCHAR(100) NOT NULL,
    stitching_type VARCHAR(32) DEFAULT 'STITCHED',
    chest VARCHAR(32),
    waist VARCHAR(32),
    hip VARCHAR(32),
    length VARCHAR(32),
    special_notes TEXT,
    status VARCHAR(64) DEFAULT 'PENDING_QUOTE',
    designer_notes TEXT,
    total_amount NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 6. GRANT API ACCESS TO ANON & AUTHENTICATED ROLES
-- -------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES - 100% UNRESTRICTED FOR PORTAL WORKFLOW
-- -------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to media_gallery" ON public.media_gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to custom_requests" ON public.custom_requests FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- DATABASE SETUP COMPLETE: 0 Dummy Rows. Real-time Workflow Active.
-- =========================================================================
