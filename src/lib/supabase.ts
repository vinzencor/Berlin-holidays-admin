import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Database = {
  public: {
    Tables: {
      room_types: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['room_types']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['room_types']['Insert']>;
      };
      bookings: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      room_availability: {
        Row: {
          id: string;
          room_type_id: string;
          date: string;
          available_rooms: number;
          blocked_rooms: number;
          minimum_stay: number | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          total_rooms: number | null;
          booked_rooms: number | null;
          status: string | null;
        };
        Insert: Omit<Database['public']['Tables']['room_availability']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['room_availability']['Insert']>;
      };
      pricing_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          room_type_id: string | null;
          base_price: string;
          weekend_price: string | null;
          holiday_price: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pricing_plans']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['pricing_plans']['Insert']>;
      };
      rate_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          discount_percentage: number | null;
          min_nights: number | null;
          max_nights: number | null;
          valid_from: string | null;
          valid_to: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rate_plans']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['rate_plans']['Insert']>;
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['service_categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['service_categories']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: string;
          unit: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      special_offers: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          discount_percentage: number | null;
          discount_amount: string | null;
          valid_from: string;
          valid_to: string;
          room_type_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['special_offers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['special_offers']['Insert']>;
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string | null;
          excerpt: string | null;
          featured_image: string | null;
          author: string | null;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blog_posts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>;
      };
    };
  };
};

