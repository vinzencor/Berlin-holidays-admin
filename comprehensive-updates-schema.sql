-- ============================================
-- BERLIN HOLIDAYS - COMPREHENSIVE UPDATES
-- GST, Staff Tracking, References, Room Categories, Reports
-- ============================================

-- 1. Add GST Settings Table
CREATE TABLE IF NOT EXISTS public.gst_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gst_number VARCHAR(15) NOT NULL DEFAULT '12345678901122',
    gst_percentage DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default GST settings
INSERT INTO public.gst_settings (gst_number, gst_percentage, is_active)
VALUES ('12345678901122', 5.00, true)
ON CONFLICT DO NOTHING;

-- 2. Update bookings table for staff tracking and references
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff(id);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reference_name VARCHAR(255);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reference_details TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount_with_gst DECIMAL(10, 2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);

-- 3. Create room_categories table (Delux, Suite, etc.)
CREATE TABLE IF NOT EXISTS public.room_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create individual_rooms table (Room 1001, 1002, etc.)
CREATE TABLE IF NOT EXISTS public.individual_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_category_id UUID REFERENCES public.room_categories(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL UNIQUE,
    room_name VARCHAR(255),
    floor_number INTEGER,
    base_price DECIMAL(10, 2) NOT NULL,
    amenities TEXT[],
    images TEXT[],
    capacity INTEGER DEFAULT 2,
    size VARCHAR(100),
    bed_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'maintenance', 'blocked')),
    maintenance_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Update invoices table for GST
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2) DEFAULT 5.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_with_gst DECIMAL(10, 2);

-- 6. Create expenses table for income/expense tracking
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    vendor_name VARCHAR(255),
    receipt_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES public.staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create reports_cache table for performance
CREATE TABLE IF NOT EXISTS public.reports_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(100) NOT NULL,
    report_period VARCHAR(50),
    start_date DATE,
    end_date DATE,
    report_data JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Update room_types to link with categories (backward compatibility)
ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS room_category_id UUID REFERENCES public.room_categories(id);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON public.bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_individual_rooms_category ON public.individual_rooms(room_category_id);
CREATE INDEX IF NOT EXISTS idx_individual_rooms_status ON public.individual_rooms(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date);

-- 10. Insert default room categories
INSERT INTO public.room_categories (name, slug, description, display_order)
VALUES 
    ('Deluxe', 'deluxe', 'Deluxe rooms with premium amenities', 1),
    ('Suite', 'suite', 'Luxury suites with extra space', 2),
    ('Standard', 'standard', 'Standard comfortable rooms', 3)
ON CONFLICT (name) DO NOTHING;

-- 11. Create function to calculate GST
CREATE OR REPLACE FUNCTION calculate_gst(base_amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    gst_rate DECIMAL;
BEGIN
    SELECT gst_percentage INTO gst_rate FROM public.gst_settings WHERE is_active = true LIMIT 1;
    RETURN ROUND((base_amount * gst_rate / 100), 2);
END;
$$ LANGUAGE plpgsql;

-- 12. Enable RLS on new tables
ALTER TABLE public.gst_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_cache ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS policies (allow all for now, adjust based on auth requirements)
CREATE POLICY "Enable all access for gst_settings" ON public.gst_settings FOR ALL USING (true);
CREATE POLICY "Enable all access for room_categories" ON public.room_categories FOR ALL USING (true);
CREATE POLICY "Enable all access for individual_rooms" ON public.individual_rooms FOR ALL USING (true);
CREATE POLICY "Enable all access for expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Enable all access for reports_cache" ON public.reports_cache FOR ALL USING (true);

