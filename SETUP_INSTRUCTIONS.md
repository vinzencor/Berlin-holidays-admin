# Berlin Holidays Resort Management System - Setup Instructions

## Overview
This admin application provides real-time room management for Berlin Holidays resort, with features for:
- Real-time room status tracking (Available/Reserved/Occupied)
- Walk-in booking management
- Online booking integration
- Payment tracking and management
- Automatic status updates based on bookings

## Color Coding System
- **Green**: Available rooms (no bookings)
- **Yellow**: Reserved rooms (online bookings, not yet checked in)
- **Red**: Occupied rooms (checked-in guests, payment received)

## Setup Steps

### 1. Install Dependencies
```bash
cd berlin-villa-flow
npm install
```

### 2. Configure Supabase

#### A. Get Your Supabase Credentials
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `rfbllniljztbbyfanzqk`
3. Go to Settings > API
4. Copy:
   - Project URL
   - `anon` public key

#### B. Update Environment Variables
Edit the `.env` file in the `berlin-villa-flow` directory:
```env
VITE_SUPABASE_URL=https://rfbllniljztbbyfanzqk.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 3. Set Up Database

#### A. Run the SQL Schema
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Open the file `supabase-schema.sql` from this project
4. Copy and paste the entire content into the SQL Editor
5. Click "Run" to execute

This will create:
- `rooms` table with all your villas and cottages
- `bookings` table for managing reservations
- Automatic triggers for status updates
- Real-time subscriptions
- Initial room data

#### B. Verify Tables
After running the schema, verify in Supabase:
- Table Editor > `rooms` should show 14 bookable rooms + 2 storage rooms
- Table Editor > `bookings` should be empty (ready for bookings)

### 4. Run the Application
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Features Guide

### 1. Dashboard Overview
- View all rooms with real-time status
- Statistics showing available, reserved, and occupied rooms
- Filter by room type (Villa/Cottage)
- Switch between grid and list view

### 2. Walk-in Booking
- Click "Walk-in Booking" button on any available room
- Fill in guest details:
  - Guest name (required)
  - Email and phone (optional)
  - Check-in and check-out dates
  - Total amount and advance payment
- Room automatically changes to "Occupied" (red) status

### 3. Online Booking Integration
When a booking is created from your customer-facing app:
- Room status automatically changes to "Reserved" (yellow)
- Booking appears in the admin dashboard
- Real-time sync ensures instant updates

### 4. Payment Management
Click "Manage" on any occupied/reserved room to:
- View complete guest information
- See payment breakdown (paid/remaining)
- Add additional payments
- Update booking status
- Process checkout

### 5. Room Status Flow
```
Available (Green)
    ↓ (Online Booking)
Reserved (Yellow)
    ↓ (Check-in / Walk-in Booking)
Occupied (Red)
    ↓ (Checkout + Full Payment)
Available (Green)
```

## Database Schema

### Rooms Table
- `id`: UUID (primary key)
- `name`: Room name
- `type`: villa | cottage | storage
- `status`: available | reserved | occupied
- `is_bookable`: Boolean (false for storage rooms)

### Bookings Table
- `id`: UUID (primary key)
- `room_id`: Foreign key to rooms
- `guest_name`: Guest name
- `guest_email`: Guest email (optional)
- `guest_phone`: Guest phone (optional)
- `check_in_date`: Check-in date
- `check_out_date`: Check-out date
- `booking_type`: online | walk-in
- `total_amount`: Total booking amount
- `advance_payment`: Amount paid in advance
- `remaining_amount`: Auto-calculated remaining amount
- `payment_status`: advance | full
- `booking_status`: confirmed | checked-in | checked-out | cancelled

## Real-time Features
- Automatic room status updates when bookings change
- Live sync across multiple devices
- Instant reflection of online bookings
- Real-time payment updates

## Storage Rooms
- Storage rooms are marked as `is_bookable: false`
- They don't appear in the booking interface
- Can be used for internal tracking

## Troubleshooting

### "Error Loading Rooms"
- Check your `.env` file has correct Supabase credentials
- Verify the database schema was run successfully
- Check browser console for specific errors

### Rooms Not Updating
- Ensure real-time is enabled in Supabase (it is by default)
- Check network connection
- Refresh the page

### Can't Create Bookings
- Verify RLS policies are set correctly (schema includes public access policies)
- Check that the room is available
- Ensure all required fields are filled

## Next Steps
1. Integrate with your customer-facing booking app
2. Customize room names and types as needed
3. Add authentication for admin access
4. Set up proper RLS policies for production

## Support
For issues or questions, check:
- Supabase documentation: https://supabase.com/docs
- Project logs in Supabase Dashboard

