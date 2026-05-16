# BPP — Supabase Query Reference

import จาก `lib/supabase.ts` เสมอ:

```ts
import { supabase } from "@/lib/supabase";
```

---

## Schema Map (Entity Relationship)

```
customers (id, name, phone, is_active)
  └── pets (id, customer_id, name, type, breed, breed_2, is_mixed_breed, weight, note)
  └── bookings (id, customer_id, booking_date, booking_time, status, deposit_amount, deposit_status, note)
        └── booking_pets (booking_id, pet_id, service_type)   ← junction table
  └── hotel_bookings (id, customer_id, check_in_date, check_out_date, rate_per_night, status, deposit_amount, deposit_status)
        └── hotel_bookings_pet (hotel_booking_id, pet_id)     ← junction table
  └── sales (id, customer_id, booking_id?, hotel_booking_id?, sale_type, subtotal, discount_amount, total_amount, payment_method, ...)
        └── sale_items (sale_id, service_id?, product_id?, pet_id?, item_type, quantity, unit_price, original_price, final_price)

services (id, name, is_special, special_price, active, order_index)
  └── service_prices (service_id, pet_type_id, size_id, price)

pet_type_configs (id varchar, name, icon, order_index, active)   ← id เป็น string เช่น 'DOG', 'CAT'
  └── breeds (id, pet_type_id, name, order_index, active)
  └── size_configs (id varchar, pet_type_id, name, min_weight, max_weight, order_index, active)

products (id, name, sku, price, cost, stock_quantity, min_stock, unit, category, active)
promotions (id, name, type, value, applicable_to, active, start_date, end_date)
```

---

## Enum / Constraint Values

```ts
// pets.type
type PetType = "DOG" | "CAT";

// bookings.status
type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

// bookings.deposit_status / hotel_bookings.deposit_status
type DepositStatus = "NONE" | "HELD" | "USED" | "FORFEITED";

// hotel_bookings.status
type HotelStatus = "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

// sales.payment_method
type PaymentMethod = "CASH" | "QR" | "CREDIT_CARD";

// sales.sale_type
type SaleType = "SERVICE" | "HOTEL" | "PRODUCT" | "MIXED";

// sale_items.item_type
type ItemType = "SERVICE" | "HOTEL_ROOM" | "PRODUCT";

// promotions.type
type PromotionType = "PERCENT" | "AMOUNT";

// promotions.applicable_to
type PromotionApplicableTo = "ALL" | "SERVICE" | "HOTEL" | "PRODUCT";
```

---

## Query Patterns

### Customers

```ts
// ดึงสมาชิกทั้งหมด (active)
const { data } = await supabase
  .from("customers")
  .select("*")
  .eq("is_active", true)
  .order("created_at", { ascending: false });

// ดึงสมาชิก + สัตว์เลี้ยงทั้งหมดของเขา
const { data } = await supabase
  .from("customers")
  .select(
    `
    id, name, phone, is_active,
    pets (id, name, type, breed, breed_2, is_mixed_breed, weight, note)
  `,
  )
  .eq("id", customerId)
  .single();

// ค้นหาสมาชิกจากชื่อหรือเบอร์
const { data } = await supabase
  .from("customers")
  .select("id, name, phone, pets(id, name, type)")
  .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
  .eq("is_active", true);
```

### Pets

```ts
// ดึง pets ของ customer
const { data } = await supabase
  .from("pets")
  .select("*")
  .eq("customer_id", customerId);

// สร้าง pet ใหม่ (pure breed)
const { data } = await supabase
  .from("pets")
  .insert({
    customer_id: customerId,
    name: "บัดดี้",
    type: "DOG", // 'DOG' | 'CAT' เท่านั้น
    breed: "Golden Retriever",
    is_mixed_breed: false, // ถ้า false ต้องไม่มี breed_2
    weight: 12.5,
  })
  .select()
  .single();

// สร้าง pet (mixed breed) — ต้องมีทั้ง breed และ breed_2
const { data } = await supabase
  .from("pets")
  .insert({
    customer_id: customerId,
    name: "มิกซ์",
    type: "DOG",
    breed: "Poodle",
    breed_2: "Shih Tzu",
    is_mixed_breed: true, // ถ้า true ต้องมีทั้ง breed และ breed_2
  })
  .select()
  .single();
```

### Bookings

```ts
// ดึง bookings วันนี้ พร้อม customer + pets
const today = new Date().toISOString().split("T")[0];
const { data } = await supabase
  .from("bookings")
  .select(
    `
    id, booking_date, booking_time, status, note, deposit_amount, deposit_status,
    customers (id, name, phone),
    booking_pets (
      id, service_type,
      pets (id, name, type, breed)
    )
  `,
  )
  .eq("booking_date", today)
  .order("booking_time", { ascending: true });

// สร้าง booking พร้อม pets (2 steps)
const { data: booking } = await supabase
  .from("bookings")
  .insert({
    customer_id: customerId,
    booking_date: "2026-05-20",
    booking_time: "10:00:00",
    status: "PENDING",
    deposit_amount: 0,
    deposit_status: "NONE",
  })
  .select()
  .single();

// แล้วค่อย insert booking_pets
await supabase.from("booking_pets").insert(
  petIds.map((petId) => ({
    booking_id: booking.id,
    pet_id: petId,
    service_type: "อาบน้ำ-ตัดขน",
  })),
);

// อัปเดต status
await supabase
  .from("bookings")
  .update({ status: "CONFIRMED" }) // 'PENDING'|'CONFIRMED'|'COMPLETED'|'CANCELLED'
  .eq("id", bookingId);
```

### Hotel Bookings

```ts
// ดึง hotel bookings ที่ active พร้อม customer + pets
const { data } = await supabase
  .from("hotel_bookings")
  .select(
    `
    id, check_in_date, check_out_date, rate_per_night,
    status, deposit_amount, deposit_status, note,
    customers (id, name, phone),
    hotel_bookings_pet (
      pet_id,
      pets (id, name, type, breed)
    )
  `,
  )
  .in("status", ["RESERVED", "CHECKED_IN"])
  .order("check_in_date", { ascending: true });

// Check-out — ใช้ API route ไม่ใช่ query ตรง
// POST /api/hotel/[id]/checkout
```

### Services + Prices

```ts
// ดึง services พร้อมราคาตาม pet type และ size
const { data } = await supabase
  .from("services")
  .select(
    `
    id, name, description, is_special, special_price, order_index,
    service_prices (id, pet_type_id, size_id, price)
  `,
  )
  .eq("active", true)
  .order("order_index", { ascending: true });

// หาราคาของ service ตาม petType + size
// ถ้า is_special = true → ใช้ special_price แทน service_prices
const getServicePrice = (
  service: Service,
  petTypeId: string,
  sizeId: string,
) => {
  if (service.is_special) return service.special_price;
  return (
    service.service_prices.find(
      (p) => p.pet_type_id === petTypeId && p.size_id === sizeId,
    )?.price ?? 0
  );
};
```

### Products

```ts
// ดึงสินค้า active ทั้งหมด
const { data } = await supabase
  .from("products")
  .select("*")
  .eq("active", true)
  .order("category", { ascending: true });

// ⚠️ stock จะลดอัตโนมัติเมื่อ insert sale_items (trigger: decrease_product_stock)
// ไม่ต้อง update stock_quantity เอง
```

### Sales (POS)

```ts
// ⚠️ ทุก mutating request ต้องผ่าน API route (/api/sales) เพราะต้องมี CSRF token
// ห้าม insert/update sales ตรงผ่าน supabase client

// ดึงประวัติการขาย พร้อม items
const { data } = await supabase
  .from("sales")
  .select(
    `
    id, sale_type, subtotal, discount_amount, total_amount,
    payment_method, cash_received, change, created_at,
    customers (id, name),
    bookings (id, booking_date),
    promotions (id, name, type, value),
    sale_items (
      id, item_type, service_name, quantity, unit_price, final_price,
      pets (id, name),
      products (id, name)
    )
  `,
  )
  .order("created_at", { ascending: false })
  .limit(50);
```

### Promotions

```ts
// ดึงโปรโมชั่นที่ใช้ได้วันนี้
const today = new Date().toISOString().split("T")[0];
const { data } = await supabase
  .from("promotions")
  .select("*")
  .eq("active", true)
  .or(`start_date.is.null,start_date.lte.${today}`)
  .or(`end_date.is.null,end_date.gte.${today}`);
```

### Config (pet types + sizes + breeds)

```ts
// ดึง pet types ทั้งหมด
const { data: petTypes } = await supabase
  .from("pet_type_configs")
  .select("id, name, icon, order_index")
  .eq("active", true)
  .order("order_index", { ascending: true });
// id เป็น string เช่น 'DOG', 'CAT' — ไม่ใช่ integer

// ดึง sizes ของ pet type
const { data: sizes } = await supabase
  .from("size_configs")
  .select("id, name, min_weight, max_weight, order_index")
  .eq("pet_type_id", "DOG")
  .eq("active", true)
  .order("order_index", { ascending: true });
// id เป็น string varchar(50) ไม่ใช่ integer

// ดึง breeds ของ pet type
const { data: breeds } = await supabase
  .from("breeds")
  .select("id, name, order_index")
  .eq("pet_type_id", "DOG")
  .eq("active", true)
  .order("order_index", { ascending: true });
```

---

## Gotchas — สิ่งที่ต้องระวัง

| ปัญหา                             | รายละเอียด                                                        |
| --------------------------------- | ----------------------------------------------------------------- |
| `pet_type_configs.id` เป็น string | ไม่ใช่ int — ค่าเช่น `'DOG'`, `'CAT'`                             |
| `size_configs.id` เป็น string     | ไม่ใช่ int — varchar(50)                                          |
| Mixed breed constraint            | `is_mixed_breed=true` → ต้องมีทั้ง `breed` และ `breed_2`          |
| Pure breed constraint             | `is_mixed_breed=false` → `breed_2` ต้อง null                      |
| booking + pets                    | ต้อง insert `booking_pets` แยกหลัง insert `bookings`              |
| hotel + pets                      | ต้อง insert `hotel_bookings_pet` แยกหลัง insert `hotel_bookings`  |
| sales insert                      | ห้าม insert ตรง — ต้องผ่าน `/api/sales` (CSRF)                    |
| stock ลด                          | trigger อัตโนมัติเมื่อ insert `sale_items` — ห้าม update เอง      |
| service price                     | ถ้า `is_special=true` ใช้ `special_price` ไม่ใช่ `service_prices` |
| `hotel_bookings_pet`              | ชื่อ table ไม่ใช่ `hotel_rooms` (ชื่อ constraint เก่า)            |

---

## TypeScript Types (สำคัญ)

```ts
// Primary key types
type CustomerId = number; // serial4
type PetId = number; // serial4
type BookingId = number; // serial4
type HotelBookingId = number;
type SaleId = number;
type ServiceId = number;
type ProductId = number;
type PetTypeId = string; // varchar — 'DOG' | 'CAT'
type SizeId = string; // varchar — e.g. 'DOG_SMALL'
```
