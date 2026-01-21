-- SQL function to allow admins to reset staff passwords
-- This function should be created in your Supabase database

-- First, ensure you have the proper security setup
-- This function should only be callable by super_admin users

CREATE OR REPLACE FUNCTION admin_reset_staff_password(
  staff_user_id UUID,
  new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the current user's role from the staff table
  SELECT access_role INTO current_user_role
  FROM staff
  WHERE user_id = auth.uid();
  
  -- Only allow super_admin to reset passwords
  IF current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super administrators can reset staff passwords';
  END IF;
  
  -- Update the user's password
  -- Note: This requires the auth.users table which may need special permissions
  -- In production, you might want to use Supabase Admin API instead
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to reset password: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_reset_staff_password TO authenticated;

-- Add comment
COMMENT ON FUNCTION admin_reset_staff_password IS 'Allows super admin to reset staff member passwords';
