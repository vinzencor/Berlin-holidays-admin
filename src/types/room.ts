export type BookingType = 'online' | 'walk-in';
export type PaymentStatus = 'advance' | 'full';
export type BookingStatus = 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';

export interface RoomType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  capacity: number;
  size: string | null;
  base_price: string;
  amenities: string[] | null;
  images: string[] | null;
  total_rooms: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_label: string | null;
  bed_type: string | null;
  star_rating: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  early_check_in: boolean | null;
  house_rules: string | null;
  children_policy: string | null;
}

export interface Booking {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  room_id: string | null;
  room_name: string | null;
  check_in_date: string;
  check_out_date: string;
  number_of_rooms: number | null;
  number_of_adults: number | null;
  number_of_children: number | null;
  total_guests: number | null;
  special_requests: string | null;
  status: string | null;
  total_amount: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface RoomAvailability {
  id: string;
  room_type_id: string;
  date: string;
  available_rooms: number;
  blocked_rooms: number;
  booked_rooms: number | null;
  total_rooms: number | null;
  status: string | null;
}

export interface RoomTypeWithBookings extends RoomType {
  active_bookings?: Booking[];
  booked_count?: number;
  available_count?: number;
}

// Legacy types for backward compatibility
export type Room = RoomType;
export type RoomWithBooking = RoomTypeWithBookings;
