# Super Admin Setup Guide

## Super Admin Credentials

**Email:** rahulpradeepan77@gmail.com  
**Password:** 987654321  
**Role:** Super Admin (Full Access)

---

## Setup Instructions

### Method 1: Using Supabase Dashboard (Recommended)

#### Step 1: Run Database Migration
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of `database-restructure.sql`
3. Click **"Run"**
4. Wait for completion (should see success messages)
5. The script will create a staff record for the super admin

#### Step 2: Create Auth User
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** button (top right)
3. Select **"Create new user"**
4. Fill in the form:
   - **Email:** `rahulpradeepan77@gmail.com`
   - **Password:** `987654321`
   - **Auto Confirm User:** ✅ **YES** (Important!)
   - **Email Confirm:** ✅ **YES**
5. Click **"Create user"**
6. **Copy the User ID** (UUID) that appears in the users list

#### Step 3: Link Auth User to Staff Record
1. Go back to **SQL Editor**
2. Run this query (replace `<USER_ID>` with the actual UUID you copied):

```sql
UPDATE staff 
SET user_id = '<USER_ID>' 
WHERE email = 'rahulpradeepan77@gmail.com';
```

Example:
```sql
UPDATE staff 
SET user_id = '123e4567-e89b-12d3-a456-426614174000' 
WHERE email = 'rahulpradeepan77@gmail.com';
```

3. Click **"Run"**
4. You should see: `UPDATE 1` (meaning 1 row updated)

#### Step 4: Verify Setup
Run this query to verify everything is set up correctly:

```sql
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.email,
    s.access_role,
    s.user_id,
    s.is_active
FROM staff s
WHERE s.email = 'rahulpradeepan77@gmail.com';
```

You should see:
- ✅ `first_name`: Rahul
- ✅ `last_name`: Pradeepan
- ✅ `email`: rahulpradeepan77@gmail.com
- ✅ `access_role`: super_admin
- ✅ `user_id`: (should have a UUID, not null)
- ✅ `is_active`: true

#### Step 5: Login
1. Go to your application login page
2. Enter:
   - **Email:** rahulpradeepan77@gmail.com
   - **Password:** 987654321
3. Click **"Login"**
4. You should be logged in as Super Admin with full access to all features

---

### Method 2: Using Supabase API (Alternative)

If you prefer to use the Supabase API, you can run this in your application:

```javascript
import { supabase } from '@/lib/supabase';

async function createSuperAdmin() {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'rahulpradeepan77@gmail.com',
    password: '987654321',
    options: {
      data: {
        first_name: 'Rahul',
        last_name: 'Pradeepan',
        access_role: 'super_admin',
      },
    },
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }

  const userId = authData.user?.id;

  // 2. Update staff record with user_id
  const { error: staffError } = await supabase
    .from('staff')
    .update({ user_id: userId })
    .eq('email', 'rahulpradeepan77@gmail.com');

  if (staffError) {
    console.error('Error updating staff record:', staffError);
    return;
  }

  console.log('Super admin created successfully!');
}

// Call the function
createSuperAdmin();
```

---

## Troubleshooting

### Issue: "Email already registered"
**Solution:** The auth user already exists. Just link it to the staff record:
1. Go to Authentication → Users
2. Find the user with email `rahulpradeepan77@gmail.com`
3. Copy the User ID
4. Run the UPDATE query from Step 3 above

### Issue: "Cannot login"
**Possible causes:**
1. Auth user not created → Go to Authentication → Users and verify user exists
2. User not confirmed → Make sure "Auto Confirm User" was checked
3. Wrong password → Password should be exactly: `987654321`
4. user_id not linked → Run the UPDATE query from Step 3

### Issue: "Staff sees limited menu instead of full menu"
**Solution:** Check access_role in staff table:
```sql
SELECT access_role FROM staff WHERE email = 'rahulpradeepan77@gmail.com';
```
Should return: `super_admin`

If not, update it:
```sql
UPDATE staff 
SET access_role = 'super_admin' 
WHERE email = 'rahulpradeepan77@gmail.com';
```

---

## What Super Admin Can Do

✅ **Full Dashboard Access:**
- Dashboard (Calendar View)
- Bookings Management
- Invoices & Payment Settlement
- Room Availability

✅ **Admin Features:**
- Staff Management (Create/Edit/Delete staff)
- Revenue Management System (RMS)
- Property Management System (PMS)
- Room Types Management
- Pricing Plans
- Rate Plans
- Services Management

✅ **Special Permissions:**
- Create new staff members with login credentials
- Assign access roles (Staff or Super Admin)
- View all financial data
- Access all system settings
- Give discounts on bookings
- Generate and download invoices

---

## Security Notes

⚠️ **Important:**
- Change the password after first login
- Keep credentials secure
- Don't share super admin access
- Create separate staff accounts for team members
- Regularly review staff access levels

---

## Next Steps After Login

1. ✅ Login with super admin credentials
2. ✅ Verify you see all menu items
3. ✅ Go to Staff Management
4. ✅ Create staff accounts for your team
5. ✅ Test the new calendar-based booking flow
6. ✅ Create a test booking and settle payment
7. ✅ Generate a test invoice
8. ✅ Verify room availability updates

---

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs
3. Verify database migration completed successfully
4. Ensure all tables exist (staff, bookings, individual_rooms, etc.)
5. Check RLS policies are enabled

