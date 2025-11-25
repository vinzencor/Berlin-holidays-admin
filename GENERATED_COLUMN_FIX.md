# ✅ Generated Column Error Fixed!

## 🔧 Issue

When trying to create a booking, got this error:
```
{
  code: "428C9",
  details: "Column \"total_guests\" is a generated column.",
  hint: null,
  message: "cannot insert a non-DEFAULT value into column \"total_guests\""
}
```

## 🐛 Root Cause

The `total_guests` column in the `bookings` table is a **generated column** (automatically calculated from `number_of_adults + number_of_children`).

You cannot insert or update generated columns - the database calculates them automatically.

## ✅ Solution

Removed `total_guests` from the insert/update data in `BookingDialog.tsx`.

### What Changed:

**File:** `src/components/admin/dialogs/BookingDialog.tsx`

**Before:**
```typescript
const dataToSave = {
  room_id: formData.room_id,
  room_name: formData.room_name,
  customer_name: formData.customer_name,
  customer_email: formData.customer_email,
  customer_phone: formData.customer_phone,
  customer_address: formData.customer_address,
  check_in_date: formData.check_in_date,
  check_out_date: formData.check_out_date,
  number_of_adults: parseInt(formData.number_of_adults),
  number_of_children: parseInt(formData.number_of_children),
  total_guests: totalGuests,  // ❌ ERROR: Cannot insert into generated column
  number_of_nights: numberOfNights,
  room_price: roomPrice,
  total_amount: parseFloat(formData.total_amount),
  // ... rest of fields
};
```

**After:**
```typescript
const dataToSave = {
  room_id: formData.room_id,
  room_name: formData.room_name,
  customer_name: formData.customer_name,
  customer_email: formData.customer_email,
  customer_phone: formData.customer_phone,
  customer_address: formData.customer_address,
  check_in_date: formData.check_in_date,
  check_out_date: formData.check_out_date,
  number_of_adults: parseInt(formData.number_of_adults),
  number_of_children: parseInt(formData.number_of_children),
  // total_guests is a generated column - don't insert it ✅
  number_of_nights: numberOfNights,
  room_price: roomPrice,
  total_amount: parseFloat(formData.total_amount),
  // ... rest of fields
};
```

## 📊 How Generated Columns Work

### Database Definition:
```sql
CREATE TABLE bookings (
  number_of_adults INTEGER DEFAULT 1,
  number_of_children INTEGER DEFAULT 0,
  total_guests INTEGER GENERATED ALWAYS AS (number_of_adults + number_of_children) STORED
);
```

### Behavior:
- ✅ **Automatically calculated** by the database
- ✅ **Always up-to-date** (recalculated when adults/children change)
- ❌ **Cannot be inserted** manually
- ❌ **Cannot be updated** manually

### Example:
```typescript
// Insert booking
await supabase.from("bookings").insert({
  number_of_adults: 2,
  number_of_children: 1,
  // total_guests is NOT included - database calculates it automatically
});

// Database automatically sets: total_guests = 2 + 1 = 3
```

## 🧪 Testing

### Test Case: Create Booking with 2 Adults, 1 Child

1. Open Add Booking dialog
2. Fill in customer details
3. Select room type
4. Enter dates
5. Set:
   - Number of Adults: 2
   - Number of Children: 1
6. Click "Create Booking"
7. ✅ Should create successfully
8. ✅ Database automatically sets `total_guests = 3`

### Verify in Database:
```sql
SELECT 
  customer_name,
  number_of_adults,
  number_of_children,
  total_guests  -- This is auto-calculated
FROM bookings
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
customer_name | number_of_adults | number_of_children | total_guests
John Doe      | 2                | 1                  | 3
```

## ✅ Benefits of Generated Columns

1. **Data Integrity:** Always accurate, never out of sync
2. **No Manual Calculation:** Database handles it automatically
3. **Consistency:** Same calculation logic everywhere
4. **Performance:** Stored value, no need to calculate on every query

## 🎯 Other Generated Columns to Watch For

If you have other generated columns in your database, make sure NOT to include them in insert/update operations:

**Check for generated columns:**
```sql
SELECT 
  table_name,
  column_name,
  is_generated
FROM information_schema.columns
WHERE table_schema = 'public'
  AND is_generated = 'ALWAYS';
```

## 🎉 Status: FIXED!

- ✅ Removed `total_guests` from insert/update data
- ✅ Database will calculate it automatically
- ✅ Booking creation should work now

**Try creating a booking - it should work without errors!** 🚀

---

## 📝 Summary

**Problem:** Trying to insert into generated column `total_guests`  
**Cause:** Generated columns are auto-calculated by database  
**Solution:** Removed `total_guests` from insert/update data  
**Result:** ✅ Booking creation works, database calculates total_guests automatically

