-- Berlin Holidays Resort Management System - Complete Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ROOM TYPES TABLE (Main room categories)
-- ============================================
CREATE TABLE IF NOT EXISTS public.room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 2,
    size VARCHAR(100),
    base_price DECIMAL(10, 2) NOT NULL,
    amenities TEXT[],
    images TEXT[],
    total_rooms INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    category_label VARCHAR(100),
    bed_type VARCHAR(100),
    star_rating INTEGER,
    check_in_time TIME,
    check_out_time TIME,
    early_check_in BOOLEAN DEFAULT false,
    house_rules TEXT,
    children_policy TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 2. BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
    room_name VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_rooms INTEGER NOT NULL DEFAULT 1,
    number_of_adults INTEGER NOT NULL DEFAULT 2,
    number_of_children INTEGER DEFAULT 0,
    total_guests INTEGER NOT NULL DEFAULT 2,
    total_amount DECIMAL(10, 2) NOT NULL,
    advance_payment DECIMAL(10, 2) DEFAULT 0,
    remaining_amount DECIMAL(10, 2),
    payment_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    booking_type VARCHAR(50) DEFAULT 'online',
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
);

-- ============================================
-- 3. ROOM AVAILABILITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.room_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_rooms INTEGER NOT NULL DEFAULT 0,
    available_rooms INTEGER NOT NULL DEFAULT 0,
    booked_rooms INTEGER NOT NULL DEFAULT 0,
    blocked_rooms INTEGER NOT NULL DEFAULT 0,
    minimum_stay INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(room_type_id, date)
);

-- ============================================
-- 4. PRICING PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
    base_price DECIMAL(10, 2) NOT NULL,
    weekend_price DECIMAL(10, 2),
    holiday_price DECIMAL(10, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 5. RATE PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rate_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5, 2),
    min_nights INTEGER,
    max_nights INTEGER,
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 6. SERVICE CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 7. SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 8. SPECIAL OFFERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.special_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 9. BLOG POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT,
    excerpt TEXT,
    featured_image TEXT,
    author VARCHAR(255),
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON public.room_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_availability_updated_at BEFORE UPDATE ON public.room_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON public.pricing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_plans_updated_at BEFORE UPDATE ON public.rate_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON public.service_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_special_offers_updated_at BEFORE UPDATE ON public.special_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Enable read access for all users" ON public.room_types FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.room_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.room_types FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.room_types FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.bookings FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.room_availability FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.room_availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.room_availability FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.room_availability FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.pricing_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.pricing_plans FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.pricing_plans FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.rate_plans FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.rate_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.rate_plans FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.rate_plans FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.service_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.service_categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.service_categories FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.services FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.services FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.services FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.services FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.special_offers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.special_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.special_offers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.special_offers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.blog_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.blog_posts FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.blog_posts FOR DELETE USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_room_types_slug ON public.room_types(slug);
CREATE INDEX IF NOT EXISTS idx_room_types_is_active ON public.room_types(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_room_type_id ON public.bookings(room_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_room_availability_room_type_date ON public.room_availability(room_type_id, date);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_room_type_id ON public.pricing_plans(room_type_id);
CREATE INDEX IF NOT EXISTS idx_special_offers_room_type_id ON public.special_offers(room_type_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);

