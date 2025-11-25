-- ============================================
-- BERLIN HOLIDAYS - DATABASE RESTRUCTURE
-- New Flow: Calendar-based booking with payment settlement
-- ============================================

-- 1. Add user_id and access_role to staff table for login capability
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS access_role VARCHAR(50) DEFAULT 'staff' CHECK (access_role IN ('super_admin', 'staff'));
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Update bookings table for new flow
-- Add payment and discount fields
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS settled_by UUID REFERENCES staff(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50) UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id_proof VARCHAR(255);

-- 3. Create individual_rooms table for tracking specific room instances
CREATE TABLE IF NOT EXISTS individual_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL UNIQUE,
    floor_number INTEGER,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create room_bookings junction table for individual room assignments
CREATE TABLE IF NOT EXISTS room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    individual_room_id UUID REFERENCES individual_rooms(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'reserved' CHECK (status IN ('reserved', 'checked_in', 'checked_out', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(individual_room_id, check_in_date, check_out_date)
);

-- 5. Create invoices table (if not exists) with all required fields
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    room_name VARCHAR(255),
    room_address TEXT,
    check_in_date DATE,
    check_out_date DATE,
    number_of_nights INTEGER,
    base_amount NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) DEFAULT 0,
    balance NUMERIC(10,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue')),
    payment_method VARCHAR(50),
    notes TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    generated_by UUID REFERENCES staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    invoice_num TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE invoice_number LIKE 'INV-%';
    
    invoice_num := 'INV-' || LPAD(next_number::TEXT, 6, '0');
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- 8. Create function to update room availability based on bookings
CREATE OR REPLACE FUNCTION update_room_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'checked_in' THEN
            UPDATE individual_rooms
            SET status = 'occupied'
            WHERE id IN (
                SELECT individual_room_id
                FROM room_bookings
                WHERE booking_id = NEW.id
            );
        ELSIF NEW.status = 'checked_out' OR NEW.status = 'cancelled' THEN
            UPDATE individual_rooms
            SET status = 'available'
            WHERE id IN (
                SELECT individual_room_id
                FROM room_bookings
                WHERE booking_id = NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_room_availability ON bookings;
CREATE TRIGGER trigger_update_room_availability
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_room_availability();

-- 9. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_individual_rooms_updated_at ON individual_rooms;
CREATE TRIGGER update_individual_rooms_updated_at BEFORE UPDATE ON individual_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_room_bookings_updated_at ON room_bookings;
CREATE TRIGGER update_room_bookings_updated_at BEFORE UPDATE ON room_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Populate individual_rooms from room_types
-- This creates individual room instances for each room type
DO $$
DECLARE
    room_type RECORD;
    room_count INTEGER;
    floor_num INTEGER;
BEGIN
    FOR room_type IN SELECT id, name, total_rooms FROM room_types WHERE total_rooms > 0 LOOP
        FOR room_count IN 1..room_type.total_rooms LOOP
            -- Calculate floor number (assuming 10 rooms per floor)
            floor_num := CEIL(room_count::NUMERIC / 10);

            INSERT INTO individual_rooms (room_type_id, room_number, floor_number, status)
            VALUES (
                room_type.id,
                SUBSTRING(room_type.name FROM 1 FOR 3) || '-' || LPAD(room_count::TEXT, 3, '0'),
                floor_num,
                'available'
            )
            ON CONFLICT (room_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 11. Enable Row Level Security (RLS) for new tables
ALTER TABLE individual_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (adjust based on your security needs)
CREATE POLICY "Enable read access for all users" ON individual_rooms FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON individual_rooms FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON room_bookings FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON room_bookings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON invoices FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON invoices FOR ALL USING (auth.role() = 'authenticated');

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_individual_rooms_room_type ON individual_rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_individual_rooms_status ON individual_rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_bookings_booking ON room_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_room ON room_bookings(individual_room_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_dates ON room_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_access_role ON staff(access_role);

-- 13. Create view for available rooms by date range
CREATE OR REPLACE VIEW available_rooms_by_date AS
SELECT
    ir.id as room_id,
    ir.room_number,
    rt.name as room_type_name,
    rt.base_price,
    ir.status,
    ir.floor_number
FROM individual_rooms ir
JOIN room_types rt ON ir.room_type_id = rt.id
WHERE ir.is_active = true AND ir.status = 'available';

-- 14. Create view for booking calendar
CREATE OR REPLACE VIEW booking_calendar AS
SELECT
    b.id as booking_id,
    b.customer_name,
    b.customer_email,
    b.customer_phone,
    b.check_in_date,
    b.check_out_date,
    b.status,
    b.total_amount,
    b.paid_amount,
    b.discount_amount,
    b.payment_status,
    b.is_settled,
    rb.individual_room_id,
    ir.room_number,
    rt.name as room_type_name,
    rt.base_price
FROM bookings b
LEFT JOIN room_bookings rb ON b.id = rb.booking_id
LEFT JOIN individual_rooms ir ON rb.individual_room_id = ir.id
LEFT JOIN room_types rt ON ir.room_type_id = rt.id;

-- 15. Create Super Admin User
-- Note: This creates the super admin in the staff table
-- You'll need to create the auth user manually in Supabase Auth or via signup
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if super admin already exists
    IF NOT EXISTS (SELECT 1 FROM staff WHERE email = 'rahulpradeepan77@gmail.com') THEN
        -- Insert super admin staff record
        -- Note: The user_id will be set after creating the auth user
        INSERT INTO staff (
            first_name,
            last_name,
            email,
            phone,
            role,
            department,
            hire_date,
            status,
            access_role,
            is_active
        ) VALUES (
            'Rahul',
            'Pradeepan',
            'rahulpradeepan77@gmail.com',
            '9876543210',
            'manager',
            'management',
            CURRENT_DATE,
            'active',
            'super_admin',
            true
        );

        RAISE NOTICE 'Super admin staff record created for rahulpradeepan77@gmail.com';
        RAISE NOTICE 'IMPORTANT: You need to create the auth user manually:';
        RAISE NOTICE '1. Go to Supabase Dashboard → Authentication → Users';
        RAISE NOTICE '2. Click "Add User" → "Create new user"';
        RAISE NOTICE '3. Email: rahulpradeepan77@gmail.com';
        RAISE NOTICE '4. Password: 987654321';
        RAISE NOTICE '5. After creating, copy the User ID';
        RAISE NOTICE '6. Run: UPDATE staff SET user_id = ''<USER_ID>'' WHERE email = ''rahulpradeepan77@gmail.com'';';
    ELSE
        RAISE NOTICE 'Super admin already exists in staff table';
    END IF;
END $$;

-- ============================================
-- SCRIPT COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Create auth user for super admin:
--    - Go to Supabase Dashboard → Authentication → Users
--    - Click "Add User" → "Create new user"
--    - Email: rahulpradeepan77@gmail.com
--    - Password: 987654321
--    - Auto Confirm User: YES
-- 3. Link auth user to staff record:
--    - Copy the User ID from auth.users
--    - Run: UPDATE staff SET user_id = '<USER_ID>' WHERE email = 'rahulpradeepan77@gmail.com';
-- 4. Verify tables and data
-- 5. Login with rahulpradeepan77@gmail.com / 987654321
-- ============================================

