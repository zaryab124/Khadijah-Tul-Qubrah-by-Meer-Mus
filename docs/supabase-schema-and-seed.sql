-- =========================================================================
-- KHADIJAH-TUL-QUBRAH BY Meer&Mus
-- Haute Couture & Luxury Clothing Atelier - Supabase Database Schema
-- Project: sijfxilgezxtprswtrmx
-- =========================================================================
-- This script safely drops any old incompatible tables and recreates clean,
-- robust, easy-to-use tables with full Stitched vs. Unstitched workflow support.
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old tables if they exist to avoid column mismatch errors
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.media_gallery CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.custom_requests CASCADE;

-- -------------------------------------------------------------------------
-- 1. PRODUCTS TABLE (with Stitched & Unstitched Pricing Criteria)
-- -------------------------------------------------------------------------
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Bridal Couture',
    stitched_price NUMERIC(12, 2) NOT NULL,
    unstitched_price NUMERIC(12, 2) NOT NULL,
    fabric VARCHAR(255) NOT NULL,
    craft VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    gallery TEXT[] DEFAULT '{}',
    description TEXT,
    turnaround_days VARCHAR(64) DEFAULT '14 - 28 Days',
    is_customizable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 2. MEDIA GALLERY TABLE (Admin uploaded images for dresses & collections)
-- -------------------------------------------------------------------------
CREATE TABLE public.media_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'Bridal Couture',
    uploaded_by VARCHAR(100) DEFAULT 'Admin',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 3. ORDERS TABLE (Customer commission orders)
-- -------------------------------------------------------------------------
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(64),
    shipping_address TEXT,
    city VARCHAR(100) DEFAULT 'Lahore',
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    delivery_status VARCHAR(50) DEFAULT 'PROCESSING',
    tracking_number VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 4. ORDER ITEMS TABLE (Individual garments with stitching choice)
-- -------------------------------------------------------------------------
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(64),
    stitching_option VARCHAR(32) NOT NULL DEFAULT 'STITCHED', -- 'STITCHED' or 'UNSTITCHED'
    size VARCHAR(64) DEFAULT 'M', -- 'XS', 'S', 'M', 'L', 'XL', 'Custom', or 'Unstitched Fabric'
    fabric VARCHAR(255),
    craft VARCHAR(255),
    price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 5. CUSTOM DESIGN REQUESTS / COMMISSIONS (Bespoke Studio)
-- -------------------------------------------------------------------------
CREATE TABLE public.custom_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    customer_email VARCHAR(255),
    silhouette VARCHAR(100) NOT NULL,
    fabric VARCHAR(255) NOT NULL,
    craft VARCHAR(255) NOT NULL,
    colour VARCHAR(100) NOT NULL,
    stitching_type VARCHAR(32) NOT NULL DEFAULT 'STITCHED', -- 'STITCHED' or 'UNSTITCHED'
    chest VARCHAR(32),
    waist VARCHAR(32),
    hip VARCHAR(32),
    length VARCHAR(32),
    special_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_QUOTE',
    total_amount NUMERIC(12, 2),
    designer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;

-- 1. Products policies (Public can view, Anon/Admin can edit)
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

-- 2. Media Gallery policies
CREATE POLICY "Public read media_gallery" ON public.media_gallery FOR SELECT USING (true);
CREATE POLICY "Public insert media_gallery" ON public.media_gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete media_gallery" ON public.media_gallery FOR DELETE USING (true);

-- 3. Orders policies
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);

-- 4. Order Items policies
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order_items" ON public.order_items FOR SELECT USING (true);

-- 5. Custom Requests policies
CREATE POLICY "Public insert custom_requests" ON public.custom_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read custom_requests" ON public.custom_requests FOR SELECT USING (true);
CREATE POLICY "Public update custom_requests" ON public.custom_requests FOR UPDATE USING (true);

-- -------------------------------------------------------------------------
-- SEED SAMPLE COUTURE DATA (Clothes with Stitched & Unstitched Pricing)
-- -------------------------------------------------------------------------
INSERT INTO public.products (sku, name, category, unstitched_price, stitched_price, fabric, craft, image_url, description, turnaround_days)
VALUES
(
    'KTQ-PESH-001',
    'The Emerald Zardozi Peshwas',
    'Bridal Couture',
    345000.00,
    485000.00,
    'Micro Velvet 9000 & Loomed Silk',
    '24k Metallic Tilla & Antique Zardozi',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    'Sculpted from imperial Micro Velvet 9000 in jewel-toned emerald. Hand-embellished by master karigars with gold needlework, dabka, and antique zardozi. Paired with pure silk organza dupatta. Unstitched includes 12 yards fabric package & embroidered borders.',
    '14 - 28 Days'
),
(
    'KTQ-ANAR-002',
    'Bespoke Tilla Silk Anarkali',
    'Haute Couture',
    240000.00,
    340000.00,
    'Pure Katan Silk (32 Kalis)',
    'Marori Threadwork & Dabka Cuffs',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
    'Flowing pure Katan silk silhouette with 32 hand-pleated kalis. Bodice embellished with floral Mughal jaal and finished with scalloped border embroidery. Unstitched comes with pre-embroidered neckline and border patti.',
    '14 - 21 Days'
),
(
    'KTQ-LEH-003',
    'Marori Raw Silk Lehenga Set',
    'Bridal Couture',
    440000.00,
    620000.00,
    '80g Hand-Loomed Raw Silk',
    'Heavy Cutwork & Kora Dabka Zardozi',
    'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80',
    'Regal bridal lehenga set crafted on hand-loomed 80g raw silk. Adorned with geometric Mughal motifs executed in heavy cutwork and French knots. Unstitched package includes 16 unstitched lehenga panels, choli piece, and dupatta.',
    '21 - 35 Days'
),
(
    'KTQ-DUP-004',
    'Handcrafted Organza Dupatta & Kurta',
    'Luxury Pret',
    75000.00,
    115000.00,
    'Pure French Silk Organza',
    'Resham Jaal & Freshwater Pearls',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80',
    'Delicate French silk organza shirt and dupatta adorned with hand-stitched seed pearls and pastel resham embroidery. Unstitched format ready for your tailor.',
    '7 - 14 Days'
),
(
    'KTQ-GHR-005',
    'Imperial Crimson Farshi Gharara',
    'Bridal Couture',
    380000.00,
    525000.00,
    'Kimkhab Brocade & Pure Katan Silk',
    'Gotapatti & Antique Tilla Needlework',
    'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=1200&q=80',
    'Classic Awadhi silhouette reimagined for modern brides. Kimkhab brocade gharara flare paired with hand-embroidered katan silk kurta and heavy gotapatti veil.',
    '21 - 28 Days'
),
(
    'KTQ-SAREE-006',
    'Gold Tissue Royal Draped Saree',
    'Formal Atelier',
    195000.00,
    275000.00,
    'Metallic Gold Tissue & Chiffon',
    'Fine Thread Shadow Work & Sequins',
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=80',
    'Dazzling gold tissue saree with scalloped hand-cut embroidered borders. Stitched includes custom blouse stitching and petticoat. Unstitched includes 6.5 meters tissue with blouse piece.',
    '10 - 18 Days'
);

-- -------------------------------------------------------------------------
-- SEED MEDIA GALLERY PHOTOS
-- -------------------------------------------------------------------------
INSERT INTO public.media_gallery (title, image_url, category, uploaded_by, is_featured)
VALUES
('Emerald Velvet Peshwas - Front View', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80', 'Bridal Couture', 'Admin', true),
('Bespoke Silk Anarkali - Mughal Jaal', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80', 'Haute Couture', 'Admin', true),
('Marori Bridal Raw Silk Lehenga Set', 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80', 'Bridal Couture', 'Admin', true),
('Handcrafted Organza Dupatta', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80', 'Luxury Pret', 'Admin', false),
('Imperial Farshi Gharara in Kimkhab', 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=1200&q=80', 'Bridal Couture', 'Admin', false),
('Gold Tissue Saree with Embroidered Pallu', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=80', 'Formal Atelier', 'Admin', false);
