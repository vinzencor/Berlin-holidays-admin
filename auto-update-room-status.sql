-- Automatic Room Status Update Trigger
-- This trigger automatically updates room status based on booking status changes

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS booking_status_trigger ON public.bookings;
DROP FUNCTION IF EXISTS update_room_status();

-- Create function to update room status
CREATE OR REPLACE FUNCTION update_room_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new booking is created or updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update room status based on booking status
    IF NEW.status = 'confirmed' THEN
      -- Online bookings that are confirmed but not checked in
      UPDATE public.rooms 
      SET status = 'reserved', updated_at = NOW()
      WHERE id = NEW.room_id;
      
    ELSIF NEW.status = 'checked-in' THEN
      -- Walk-in bookings or checked-in guests
      UPDATE public.rooms 
      SET status = 'occupied', updated_at = NOW()
      WHERE id = NEW.room_id;
      
    ELSIF NEW.status IN ('checked-out', 'cancelled') THEN
      -- Guest has left or booking was cancelled
      -- Only set to available if no other active bookings exist for this room
      UPDATE public.rooms 
      SET status = 'available', updated_at = NOW()
      WHERE id = NEW.room_id
      AND NOT EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE room_id = NEW.room_id 
        AND status IN ('confirmed', 'checked-in')
        AND id != NEW.id
      );
    END IF;
  END IF;
  
  -- When a booking is deleted
  IF TG_OP = 'DELETE' THEN
    -- Set room to available if no other active bookings exist
    UPDATE public.rooms 
    SET status = 'available', updated_at = NOW()
    WHERE id = OLD.room_id
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE room_id = OLD.room_id 
      AND status IN ('confirmed', 'checked-in')
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after INSERT, UPDATE, or DELETE on bookings
CREATE TRIGGER booking_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_room_status();

-- Optional: Add updated_at trigger for rooms table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Test the trigger (optional - comment out if not needed)
-- This will show you that the trigger is working
DO $$
BEGIN
  RAISE NOTICE 'Room status trigger installed successfully!';
  RAISE NOTICE 'Rooms will now automatically update their status based on bookings.';
END $$;

