import { createClient } from "@supabase/supabase-js";

// Supabase Client สำหรับ Client-side (Browser)
// ใช้ anon key ที่มีสิทธิ์จำกัด
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Supabase Admin Client สำหรับ Server-side
// ใช้ service_role key ที่มีสิทธิ์เต็ม (bypass RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Database types (สามารถ generate จาก Supabase CLI ได้)
export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: number;
          name: string;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pets: {
        Row: {
          id: number;
          customer_id: number;
          name: string;
          type: "DOG" | "CAT";
          breed: string | null;
          weight: number;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          customer_id: number;
          name: string;
          type: "DOG" | "CAT";
          breed?: string | null;
          weight: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          customer_id?: number;
          name?: string;
          type?: "DOG" | "CAT";
          breed?: string | null;
          weight?: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pet_type_configs: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          order_index: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          icon?: string | null;
          order_index: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          order_index?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      size_configs: {
        Row: {
          id: string;
          pet_type_id: string;
          name: string;
          min_weight: number | null;
          max_weight: number | null;
          description: string | null;
          order_index: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          pet_type_id: string;
          name: string;
          min_weight?: number | null;
          max_weight?: number | null;
          description?: string | null;
          order_index: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pet_type_id?: string;
          name?: string;
          min_weight?: number | null;
          max_weight?: number | null;
          description?: string | null;
          order_index?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_prices: {
        Row: {
          id: number;
          service_id: number;
          pet_type_id: string;
          size_id: string;
          price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          service_id: number;
          pet_type_id: string;
          size_id: string;
          price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          service_id?: number;
          pet_type_id?: string;
          size_id?: string;
          price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      promotions: {
        Row: {
          id: number;
          name: string;
          type: "PERCENT" | "AMOUNT" | "FREE_SERVICE";
          value: number;
          free_service_id: number | null;
          applicable_to: "ALL" | "SERVICE" | "HOTEL" | "PRODUCT";
          active: boolean;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          type: "PERCENT" | "AMOUNT" | "FREE_SERVICE";
          value: number;
          free_service_id?: number | null;
          applicable_to?: "ALL" | "SERVICE" | "HOTEL" | "PRODUCT";
          active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          type?: "PERCENT" | "AMOUNT" | "FREE_SERVICE";
          value?: number;
          free_service_id?: number | null;
          applicable_to?: "ALL" | "SERVICE" | "HOTEL" | "PRODUCT";
          active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: number;
          customer_id: number | null;
          customer_name: string;
          phone: string;
          pet_type: "DOG" | "CAT";
          service_type: string;
          booking_date: string;
          booking_time: string;
          note: string | null;
          deposit_amount: number;
          deposit_status: "NONE" | "HELD" | "USED" | "FORFEITED";
          deposit_forfeited_date: string | null;
          status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          customer_id?: number | null;
          customer_name: string;
          phone: string;
          pet_type: "DOG" | "CAT";
          service_type: string;
          booking_date: string;
          booking_time: string;
          note?: string | null;
          deposit_amount?: number;
          deposit_status?: "NONE" | "HELD" | "USED" | "FORFEITED";
          deposit_forfeited_date?: string | null;
          status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          customer_id?: number | null;
          customer_name?: string;
          phone?: string;
          pet_type?: "DOG" | "CAT";
          service_type?: string;
          booking_date?: string;
          booking_time?: string;
          note?: string | null;
          deposit_amount?: number;
          deposit_status?: "NONE" | "HELD" | "USED" | "FORFEITED";
          deposit_forfeited_date?: string | null;
          status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
          created_at?: string;
          updated_at?: string;
        };
      };
      pos_orders: {
        Row: {
          id: number;
          order_number: string;
          customer_id: number | null;
          pet_id: number | null;
          booking_id: number | null;
          subtotal: number;
          discount_amount: number;
          deposit_used: number;
          total_amount: number;
          status: "PENDING" | "COMPLETED" | "CANCELLED";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          order_number?: string;
          customer_id?: number | null;
          pet_id?: number | null;
          booking_id?: number | null;
          subtotal: number;
          discount_amount?: number;
          deposit_used?: number;
          total_amount: number;
          status?: "PENDING" | "COMPLETED" | "CANCELLED";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          order_number?: string;
          customer_id?: number | null;
          pet_id?: number | null;
          booking_id?: number | null;
          subtotal?: number;
          discount_amount?: number;
          deposit_used?: number;
          total_amount?: number;
          status?: "PENDING" | "COMPLETED" | "CANCELLED";
          created_at?: string;
          updated_at?: string;
        };
      };
      pos_order_items: {
        Row: {
          id: number;
          pos_order_id: number;
          service_id: number;
          service_name: string;
          pet_type_id: string | null;
          size_id: string | null;
          original_price: number;
          final_price: number;
          is_price_modified: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          pos_order_id: number;
          service_id: number;
          service_name: string;
          pet_type_id?: string | null;
          size_id?: string | null;
          original_price: number;
          final_price: number;
          is_price_modified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          pos_order_id?: number;
          service_id?: number;
          service_name?: string;
          pet_type_id?: string | null;
          size_id?: string | null;
          original_price?: number;
          final_price?: number;
          is_price_modified?: boolean;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: number;
          pos_order_id: number;
          method: "CASH" | "QR" | "CREDIT_CARD";
          amount: number;
          reference_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          pos_order_id: number;
          method: "CASH" | "QR" | "CREDIT_CARD";
          amount: number;
          reference_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          pos_order_id?: number;
          method?: "CASH" | "QR" | "CREDIT_CARD";
          amount?: number;
          reference_number?: string | null;
          created_at?: string;
        };
      };
      hotel_bookings: {
        Row: {
          id: number;
          customer_id: number;
          pet_id: number;
          check_in_date: string;
          check_out_date: string | null;
          rate_per_night: number;
          total_nights: number | null;
          room_total: number;
          deposit_amount: number;
          deposit_status: "NONE" | "HELD" | "USED" | "FORFEITED";
          additional_services_total: number;
          discount_amount: number;
          grand_total: number;
          paid_amount: number;
          remaining_amount: number;
          payment_method: "CASH" | "QR" | "CREDIT_CARD" | null;
          note: string | null;
          status: "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          customer_id: number;
          pet_id: number;
          check_in_date: string;
          check_out_date?: string | null;
          rate_per_night: number;
          total_nights?: number | null;
          room_total?: number;
          deposit_amount?: number;
          deposit_status?: "NONE" | "HELD" | "USED" | "FORFEITED";
          additional_services_total?: number;
          discount_amount?: number;
          grand_total?: number;
          paid_amount?: number;
          remaining_amount?: number;
          payment_method?: "CASH" | "QR" | "CREDIT_CARD" | null;
          note?: string | null;
          status?: "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          customer_id?: number;
          pet_id?: number;
          check_in_date?: string;
          check_out_date?: string | null;
          rate_per_night?: number;
          total_nights?: number | null;
          room_total?: number;
          deposit_amount?: number;
          deposit_status?: "NONE" | "HELD" | "USED" | "FORFEITED";
          additional_services_total?: number;
          discount_amount?: number;
          grand_total?: number;
          paid_amount?: number;
          remaining_amount?: number;
          payment_method?: "CASH" | "QR" | "CREDIT_CARD" | null;
          note?: string | null;
          status?: "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: number;
          name: string;
          sku: string | null;
          description: string | null;
          category: string | null;
          price: number;
          cost: number;
          stock_quantity: number;
          min_stock: number;
          unit: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          sku?: string | null;
          description?: string | null;
          category?: string | null;
          price: number;
          cost?: number;
          stock_quantity?: number;
          min_stock?: number;
          unit?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          sku?: string | null;
          description?: string | null;
          category?: string | null;
          price?: number;
          cost?: number;
          stock_quantity?: number;
          min_stock?: number;
          unit?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      hotel_additional_services: {
        Row: {
          id: number;
          hotel_booking_id: number;
          service_id: number | null;
          service_name: string;
          original_price: number;
          final_price: number;
          is_price_modified: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          hotel_booking_id: number;
          service_id?: number | null;
          service_name: string;
          original_price: number;
          final_price: number;
          is_price_modified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          hotel_booking_id?: number;
          service_id?: number | null;
          service_name?: string;
          original_price?: number;
          final_price?: number;
          is_price_modified?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
