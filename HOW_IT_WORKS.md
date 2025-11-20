# 🎯 How the Booking System Works

## 📊 Current Database Status

Based on the latest check, your database has **3 active bookings**:

### Booking 1: Delux Family Rooms
- **Customer:** Test Customer
- **Rooms Booked:** 1 room
- **Dates:** Dec 1-3, 2025
- **Status:** pending
- **Amount:** ₹14,000

### Booking 2: Double Suite Room
- **Customer:** John Doe
- **Rooms Booked:** 1 room
- **Dates:** Nov 25-27, 2025
- **Status:** confirmed
- **Amount:** ₹10,000

### Booking 3: Suprior Bed Rooms
- **Customer:** Sarah Smith
- **Rooms Booked:** 2 rooms
- **Dates:** Nov 22-24, 2025
- **Status:** pending
- **Amount:** ₹12,000

## 🔄 How Data Flows

### Customer Website (http://localhost:5174/)
1. Customer selects a room type (e.g., "Delux Family Rooms")
2. Chooses dates and number of rooms
3. Fills in personal details
4. Submits booking

### Database (Supabase)
5. Booking is saved to `bookings` table with:
   - `room_id` = ID of the room type (e.g., "4d64ada1-dfc8-4af2-8a09-f1901db73df5")
   - `room_name` = Name of room type (e.g., "Delux Family Rooms")
   - `number_of_rooms` = How many rooms booked (e.g., 2)
   - `status` = Booking status ("pending", "confirmed", "checked-in")
   - Customer details, dates, amount, etc.

### Admin Dashboard (http://localhost:8080/)
6. Dashboard fetches all room types from `room_types` table
7. Dashboard fetches all active bookings from `bookings` table
8. For each room type, it:
   - Finds all bookings where `room_id` matches the room type ID
   - Sums up `number_of_rooms` from all bookings = **booked_count**
   - Calculates: **available_count** = total_rooms - booked_count
9. Displays room cards with availability and booking details
10. Real-time updates via Supabase subscriptions

## 📈 Expected Dashboard Display

Based on current bookings, your dashboard should show:

### Room Type 1: Delux Family Rooms
- **Total Rooms:** 10
- **Available:** 9
- **Booked:** 1
- **Status:** Partially Booked (Yellow)
- **Active Bookings:** 1 booking listed

### Room Type 2: Double Suite Room
- **Total Rooms:** 5
- **Available:** 4
- **Booked:** 1
- **Status:** Partially Booked (Yellow)
- **Active Bookings:** 1 booking listed

### Room Type 3: Suprior Bed Rooms
- **Total Rooms:** 5
- **Available:** 3
- **Booked:** 2
- **Status:** Partially Booked (Yellow)
- **Active Bookings:** 1 booking listed (2 rooms)

### Statistics (Top of Dashboard)
- **Room Types:** 3
- **Total Rooms:** 20 total rooms
- **Available:** 16 (9 + 4 + 3)
- **Reserved:** 1 (only "confirmed" status = John Doe's booking)
- **Occupied:** 0 (no "checked-in" status yet)

## 🧪 How to Test

### Step 1: Check Current Dashboard
1. Open http://localhost:8080/
2. Open browser console (F12)
3. Look for console logs showing:
   - "All Bookings from DB:" - Should show 3 bookings
   - "Room Type: Delux Family Rooms" - Should show 1 booking
   - "Room Type: Double Suite Room" - Should show 1 booking
   - "Room Type: Suprior Bed Rooms" - Should show 1 booking (2 rooms)

### Step 2: Verify Room Cards
Each room card should display:
- Room type name
- Total/Available/Booked counts
- Base rate per night
- List of active bookings (customer names, dates, room count)
- Color: Yellow (partially booked)

### Step 3: Make a New Booking
1. Go to http://localhost:5174/
2. Select any room type
3. Choose dates and number of rooms
4. Complete the booking
5. Go back to http://localhost:8080/
6. Dashboard should update automatically (real-time!)
7. Available count should decrease
8. Booked count should increase
9. New booking should appear in the list

### Step 4: Create Walk-in Booking
1. On admin dashboard, click "Walk-in Booking" on any room
2. Fill in guest details
3. Select number of rooms (max = available count)
4. Submit
5. Booking is saved to database with status "checked-in"
6. Room card updates immediately
7. "Occupied" stat increases

## 🔍 Troubleshooting

### If bookings don't show:
1. Check browser console for errors
2. Verify Supabase connection (check for error messages)
3. Check console logs to see if bookings are being fetched
4. Verify `room_id` in bookings matches `id` in room_types

### If real-time updates don't work:
1. Check Supabase real-time is enabled for your project
2. Verify subscription is active (check console logs)
3. Try manual refresh to see if data appears

### If counts are wrong:
1. Check `number_of_rooms` field in each booking
2. Verify booking status is "pending", "confirmed", or "checked-in"
3. Check `check_out_date` is in the future (past bookings are filtered out)

## 📝 Key Points

✅ **Room Types** = Categories (Delux, Double Suite, Superior)  
✅ **Total Rooms** = How many individual rooms in each type  
✅ **Bookings** = Reference room type ID, can book multiple rooms  
✅ **Booked Count** = Sum of `number_of_rooms` from all active bookings  
✅ **Available Count** = Total rooms - Booked count  
✅ **Real-time Sync** = Dashboard updates automatically when bookings change  

## 🎉 Summary

Your system is now fully integrated! The admin dashboard at http://localhost:8080/ fetches real data from Supabase and displays:
- All 3 room types with correct availability
- All active bookings from the customer website
- Real-time updates when new bookings are made
- Ability to create walk-in bookings

**Refresh your dashboard and check the browser console to see the data!**

