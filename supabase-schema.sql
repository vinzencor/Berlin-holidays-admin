-- Berlin Holidays Resort Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('villa', 'cottage', 'storage')),
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied')),
    is_bookable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    check_in_date DATE NOT NULL,
    check_in_time TIME NOT NULL DEFAULT '14:00:00', -- 2 PM check-in
    check_out_date DATE NOT NULL,
    check_out_time TIME NOT NULL DEFAULT '12:00:00', -- 12 PM check-out next day
    booking_type VARCHAR(50) NOT NULL CHECK (booking_type IN ('online', 'walk-in')),
    total_amount DECIMAL(10, 2) NOT NULL,
    advance_payment DECIMAL(10, 2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'advance' CHECK (payment_status IN ('advance', 'full')),
    booking_status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'checked-in', 'checked-out', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT check_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT check_payment CHECK (advance_payment <= total_amount)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update room status based on bookings
CREATE OR REPLACE FUNCTION update_room_status()
RETURNS TRIGGER AS $$
DECLARE
    current_time TIMESTAMP WITH TIME ZONE;
    check_in_datetime TIMESTAMP WITH TIME ZONE;
    check_out_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
    current_time := TIMEZONE('utc'::text, NOW());

    -- When a new booking is created or updated
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- Calculate check-in and check-out datetimes
        check_in_datetime := (NEW.check_in_date::timestamp + NEW.check_in_time::interval);
        check_out_datetime := (NEW.check_out_date::timestamp + NEW.check_out_time::interval);

        -- Update room status based on booking status and current time
        IF NEW.booking_status = 'confirmed' THEN
            -- If current time is between check-in and check-out, room is occupied
            IF current_time >= check_in_datetime AND current_time <= check_out_datetime THEN
                UPDATE public.rooms SET status = 'occupied' WHERE id = NEW.room_id;
            ELSE
                UPDATE public.rooms SET status = 'reserved' WHERE id = NEW.room_id;
            END IF;
        ELSIF NEW.booking_status = 'checked-in' THEN
            UPDATE public.rooms SET status = 'occupied' WHERE id = NEW.room_id;
        ELSIF NEW.booking_status = 'checked-out' OR NEW.booking_status = 'cancelled' THEN
            -- Check if there are any other active bookings for this room at current time
            IF NOT EXISTS (
                SELECT 1 FROM public.bookings
                WHERE room_id = NEW.room_id
                AND id != NEW.id
                AND booking_status IN ('confirmed', 'checked-in')
                AND current_time >= (check_in_date::timestamp + check_in_time::interval)
                AND current_time <= (check_out_date::timestamp + check_out_time::interval)
            ) THEN
                UPDATE public.rooms SET status = 'available' WHERE id = NEW.room_id;
            END IF;
        END IF;
    END IF;

    -- When a booking is deleted
    IF (TG_OP = 'DELETE') THEN
        -- Check if there are any other active bookings for this room at current time
        IF NOT EXISTS (
            SELECT 1 FROM public.bookings
            WHERE room_id = OLD.room_id
            AND booking_status IN ('confirmed', 'checked-in')
            AND current_time >= (check_in_date::timestamp + check_in_time::interval)
            AND current_time <= (check_out_date::timestamp + check_out_time::interval)
        ) THEN
            UPDATE public.rooms SET status = 'available' WHERE id = OLD.room_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update room status
CREATE TRIGGER update_room_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_room_status();

-- Create function to calculate remaining amount
CREATE OR REPLACE FUNCTION calculate_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_amount = NEW.total_amount - NEW.advance_payment;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to calculate remaining amount
CREATE TRIGGER calculate_remaining_amount_trigger
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION calculate_remaining_amount();

-- Insert initial rooms data
INSERT INTO public.rooms (name, type, status, is_bookable) VALUES
    ('Forest Haven', 'villa', 'available', true),
    ('Pine Retreat', 'cottage', 'available', true),
    ('Meadow Vista', 'villa', 'available', true),
    ('Cedar Lodge', 'cottage', 'available', true),
    ('Willow Creek', 'villa', 'available', true),
    ('Oak Sanctuary', 'cottage', 'available', true),
    ('Birch Paradise', 'villa', 'available', true),
    ('Maple Harmony', 'cottage', 'available', true),
    ('Spruce Hideaway', 'villa', 'available', true),
    ('Aspen Heights', 'cottage', 'available', true),
    ('Elm Serenity', 'villa', 'available', true),
    ('Cypress Oasis', 'cottage', 'available', true),
    ('Redwood Escape', 'villa', 'available', true),
    ('Bamboo Grove', 'cottage', 'available', true),
    ('Storage Room 1', 'storage', 'available', false),
    ('Storage Room 2', 'storage', 'available', false)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Enable read access for all users" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.bookings FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms(type);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in_date, check_out_date);

