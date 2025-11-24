-- =====================================================
-- BERLIN HOLIDAYS RESORT - ADVANCED FEATURES SCHEMA
-- Staff Management, RMS, and PMS Features
-- =====================================================

-- =====================================================
-- STAFF MANAGEMENT TABLES
-- =====================================================

-- Staff table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- 'manager', 'receptionist', 'housekeeper', 'maintenance', 'chef', 'waiter', 'security'
    department VARCHAR(50), -- 'front_desk', 'housekeeping', 'maintenance', 'food_beverage', 'security', 'management'
    hire_date DATE NOT NULL,
    salary DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'on_leave', 'terminated'
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room Staff Assignments
CREATE TABLE IF NOT EXISTS public.room_staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    assignment_type VARCHAR(50) NOT NULL, -- 'primary', 'backup', 'temporary'
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    shift VARCHAR(20), -- 'morning', 'afternoon', 'night', 'full_day'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_type_id, staff_id, assigned_date)
);

-- =====================================================
-- REVENUE MANAGEMENT SYSTEM (RMS) TABLES
-- =====================================================

-- Dynamic Pricing Rules
CREATE TABLE IF NOT EXISTS public.dynamic_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL,
    room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
    occupancy_threshold INTEGER, -- Percentage (e.g., 80 means 80% occupancy)
    price_adjustment_type VARCHAR(20), -- 'percentage', 'fixed'
    price_adjustment_value DECIMAL(10, 2),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Demand Forecasting
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_date DATE NOT NULL,
    room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
    predicted_occupancy INTEGER, -- Percentage
    predicted_revenue DECIMAL(12, 2),
    confidence_level DECIMAL(5, 2), -- Percentage
    factors JSONB, -- Store factors like events, seasonality, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(forecast_date, room_type_id)
);

-- Competitor Pricing
CREATE TABLE IF NOT EXISTS public.competitor_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_name VARCHAR(100) NOT NULL,
    competitor_location VARCHAR(255),
    room_category VARCHAR(100), -- Similar room type
    price DECIMAL(10, 2) NOT NULL,
    date_checked DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(100), -- 'manual', 'api', 'web_scraping'
    url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue Reports
CREATE TABLE IF NOT EXISTS public.revenue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
    room_revenue DECIMAL(12, 2) DEFAULT 0,
    service_revenue DECIMAL(12, 2) DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    occupancy_rate DECIMAL(5, 2), -- Percentage
    adr DECIMAL(10, 2), -- Average Daily Rate
    revpar DECIMAL(10, 2), -- Revenue Per Available Room
    metrics JSONB, -- Additional metrics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(report_date)
);

-- =====================================================
-- PROPERTY MANAGEMENT SYSTEM (PMS) TABLES
-- =====================================================

-- Guest Profiles
CREATE TABLE IF NOT EXISTS public.guest_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    nationality VARCHAR(50),
    id_type VARCHAR(50), -- 'passport', 'drivers_license', 'national_id'
    id_number VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    preferences JSONB, -- Room preferences, dietary restrictions, etc.
    vip_status BOOLEAN DEFAULT false,
    loyalty_points INTEGER DEFAULT 0,
    total_stays INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Housekeeping Tasks
CREATE TABLE IF NOT EXISTS public.housekeeping_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    task_type VARCHAR(50) NOT NULL, -- 'cleaning', 'maintenance', 'inspection', 'turndown'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    assigned_to UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Front Desk Operations
CREATE TABLE IF NOT EXISTS public.front_desk_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL, -- 'check_in', 'check_out', 'room_change', 'extension'
    performed_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    previous_room VARCHAR(20),
    new_room VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    guest_profile_id UUID REFERENCES public.guest_profiles(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    balance DECIMAL(12, 2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'overdue'
    payment_method VARCHAR(50), -- 'cash', 'card', 'bank_transfer', 'upi'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'room', 'service', 'food', 'beverage', 'other'
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff Tasks
CREATE TABLE IF NOT EXISTS public.staff_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    task_type VARCHAR(50), -- 'maintenance', 'guest_request', 'administrative', 'other'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);
CREATE INDEX IF NOT EXISTS idx_room_staff_room_type ON public.room_staff_assignments(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_staff_staff ON public.room_staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_room ON public.dynamic_pricing_rules(room_type_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecast_date ON public.demand_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_competitor_pricing_date ON public.competitor_pricing(date_checked);
CREATE INDEX IF NOT EXISTS idx_revenue_reports_date ON public.revenue_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_email ON public.guest_profiles(email);
CREATE INDEX IF NOT EXISTS idx_housekeeping_status ON public.housekeeping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_assigned ON public.housekeeping_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_assigned ON public.staff_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_status ON public.staff_tasks(status);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_staff_updated_at BEFORE UPDATE ON public.room_staff_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dynamic_pricing_updated_at BEFORE UPDATE ON public.dynamic_pricing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demand_forecasts_updated_at BEFORE UPDATE ON public.demand_forecasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_pricing_updated_at BEFORE UPDATE ON public.competitor_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_reports_updated_at BEFORE UPDATE ON public.revenue_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_profiles_updated_at BEFORE UPDATE ON public.guest_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_housekeeping_tasks_updated_at BEFORE UPDATE ON public.housekeeping_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_tasks_updated_at BEFORE UPDATE ON public.staff_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

