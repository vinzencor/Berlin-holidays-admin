-- Migration to add check-in and check-out time fields to bookings table
-- Run this in your Supabase SQL Editor after updating the schema

-- Add time fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN check_in_time TIME NOT NULL DEFAULT '14:00:00',
ADD COLUMN check_out_time TIME NOT NULL DEFAULT '12:00:00';

-- Update existing bookings to use default times (if any exist)
-- This ensures backward compatibility

-- Update the room status update function to consider times
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

-- Add comment to document the change
COMMENT ON COLUMN public.bookings.check_in_time IS 'Check-in time (default: 14:00:00 - 2 PM)';
COMMENT ON COLUMN public.bookings.check_out_time IS 'Check-out time (default: 12:00:00 - 12 PM next day)';