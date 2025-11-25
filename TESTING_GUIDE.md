# Testing Guide - New Flow

## Prerequisites

1. **Run Database Migration**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `database-restructure.sql`
   - Click "Run" to execute
   - Verify no errors

2. **Install Dependencies** (if not already done)
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Test Scenarios

### 1. Test Calendar Dashboard

**Steps:**
1. Login to admin panel
2. You should see the new calendar-based dashboard
3. Calendar should show dates with bookings highlighted in yellow
4. Click on different dates to see bookings for that day
5. Verify booking cards show:
   - Customer name, email, phone
   - Room name and number
   - Check-in and check-out dates
   - Total amount and paid amount
   - Payment status badge
   - Booking status badge

**Expected Result:** ✅ Calendar loads, dates are clickable, bookings display correctly

---

### 2. Test Payment Settlement

**Steps:**
1. Click on any booking card
2. Settlement modal should open
3. Verify modal shows:
   - Customer details
   - Room details
   - Base amount (read-only)
   - Discount field (editable)
   - Final amount (auto-calculated)
   - Paid amount field (editable)
   - Balance (auto-calculated)
   - Payment method dropdown
   - Notes field
4. Enter a discount amount (e.g., 500)
5. Verify final amount reduces by discount
6. Enter paid amount (e.g., full amount)
7. Verify balance shows 0
8. Select payment method (e.g., Cash)
9. Add notes (optional)
10. Click "Settle Payment"

**Expected Result:** ✅ Payment saved, success toast appears, modal closes, calendar refreshes

---

### 3. Test PDF Invoice Generation

**Steps:**
1. Open any booking settlement modal
2. Click "Download Invoice" button
3. PDF should download automatically
4. Open the PDF and verify it contains:
   - Berlin Holidays header
   - Invoice number (INV-XXXXXX)
   - Invoice date
   - Customer name, email, phone, address
   - Room name and room number
   - Check-in and check-out dates
   - Number of nights
   - Room charges breakdown
   - Discount line (if any)
   - Subtotal, Paid Amount, Balance Due
   - Professional table layout
   - Footer text

**Expected Result:** ✅ PDF downloads with all correct information

---

### 4. Test Staff Creation with Login

**Steps:**
1. Go to Staff Management section
2. Click "Add New" button
3. Fill in staff details:
   - First Name: Test
   - Last Name: Staff
   - Email: teststaff@example.com
   - Phone: 1234567890
   - Role: Receptionist
   - Department: Front Desk
4. Check "Create login credentials for this staff member"
5. Select Access Role: "Staff (Limited Access)"
6. Enter Password: "test123"
7. Click "Create Staff Member"
8. Verify success message

**Expected Result:** ✅ Staff created with login credentials

---

### 5. Test Staff Login

**Steps:**
1. Logout from admin panel
2. Go to login page
3. Login with staff credentials:
   - Email: teststaff@example.com
   - Password: test123
4. Verify you're logged in
5. Check sidebar navigation - should only show:
   - Dashboard
   - Bookings
   - Invoices
   - Room Availability
6. Verify you CANNOT see:
   - Staff Management
   - Revenue Management
   - Room Types
   - Pricing Plans
   - Rate Plans
   - Services

**Expected Result:** ✅ Staff can login, sees limited menu

---

### 6. Test Staff Can Give Discounts

**Steps:**
1. While logged in as staff
2. Go to Dashboard
3. Click on a booking
4. Verify you can:
   - Set discount amount
   - Record payment
   - Settle payment
   - Download invoice
5. Set a discount (e.g., 1000)
6. Record payment
7. Click "Settle Payment"

**Expected Result:** ✅ Staff can give discounts and settle payments

---

### 7. Test Super Admin Access

**Steps:**
1. Logout from staff account
2. Login with super admin credentials
3. Verify sidebar shows ALL menu items:
   - Dashboard
   - Bookings
   - Invoices
   - Room Availability
   - Staff Management
   - Revenue Management
   - Room Types
   - Pricing Plans
   - Rate Plans
   - Services
4. Click on each section to verify access

**Expected Result:** ✅ Super admin has full access to all features

---

### 8. Test Room Availability

**Steps:**
1. Go to Room Availability section
2. Verify individual rooms are listed (Del-001, Del-002, etc.)
3. Check room statuses
4. Create a booking for a specific room
5. Verify room status changes to "occupied" or "reserved"
6. Settle the booking payment
7. Check out the guest
8. Verify room status changes back to "available"

**Expected Result:** ✅ Room availability updates correctly

---

### 9. Test Pricing Plans Fix

**Steps:**
1. Go to Pricing Plans section
2. Verify "Base Price" column no longer shows "NaN"
3. Verify all pricing plan data displays correctly

**Expected Result:** ✅ No NaN values, all data displays correctly

---

## Common Issues & Solutions

### Issue: Calendar not showing bookings
**Solution:** Check if bookings exist in database with valid check_in_date and check_out_date

### Issue: PDF not downloading
**Solution:** Check browser console for errors, verify jspdf and jspdf-autotable are installed

### Issue: Staff login not working
**Solution:** Verify staff has user_id set in database, check Supabase auth users table

### Issue: Role-based access not working
**Solution:** Verify access_role is set correctly in staff table, check AdminLayout useEffect

### Issue: Room numbers not showing
**Solution:** Run database migration script to populate individual_rooms table

---

## Database Verification Queries

Run these in Supabase SQL Editor to verify data:

```sql
-- Check individual rooms
SELECT * FROM individual_rooms LIMIT 10;

-- Check staff with access roles
SELECT id, first_name, last_name, email, access_role, user_id FROM staff;

-- Check invoices
SELECT * FROM invoices ORDER BY created_at DESC LIMIT 5;

-- Check bookings with payment info
SELECT id, customer_name, total_amount, paid_amount, discount_amount, payment_status, is_settled 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Success Criteria

- ✅ Calendar dashboard loads and shows bookings
- ✅ Clicking dates shows correct bookings
- ✅ Payment settlement works with discount
- ✅ PDF invoice generates with all details
- ✅ Staff can be created with login credentials
- ✅ Staff can login and see limited menu
- ✅ Staff can give discounts
- ✅ Super admin sees all features
- ✅ Room availability updates correctly
- ✅ Pricing plans show correct data (no NaN)

---

## Next Steps After Testing

1. Deploy to Vercel (git push)
2. Test on production URL
3. Create initial super admin account
4. Create staff accounts for team
5. Train staff on new flow
6. Monitor for any issues

