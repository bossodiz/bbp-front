// ============================================================================
// DATABASE RAW TYPES - ทำให้ replace `any` types
// ============================================================================

export interface RawProduct {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  price: number | string;
  cost: number | string;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RawSale {
  id: number;
  booking_id: number | null;
  customer_id: number | null;
  subtotal: number | string;
  discount_amount: number | string;
  promotion_id: number | null;
  custom_discount: number | string;
  deposit_used: number | string;
  total_amount: number | string;
  payment_method: string;
  cash_received: number | string | null;
  change: number | string | null;
  sale_type: string;
  hotel_booking_id: number | null;
  created_at: string;
  customers?: {
    id: number;
    name: string;
    phone: string | null;
  } | null;
  sale_items?: RawSaleItem[];
}

export interface RawSaleItem {
  id: number;
  sale_id: number;
  service_id: number | null;
  service_name: string;
  pet_id: number | null;
  item_type: string;
  quantity: number;
  unit_price: number | string;
  original_price: number | string;
  final_price: number | string;
  is_price_modified: boolean;
  pets?: {
    id: number;
    name: string;
    type: string;
  } | null;
}

export interface RawCustomer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  totalSpent?: number;
  visitCount?: number;
}

export interface RawTopCustomer {
  customer_id: number;
  customer_name: string;
  customer_phone: string | null;
  total_spent: number | string;
  visit_count: number;
}
