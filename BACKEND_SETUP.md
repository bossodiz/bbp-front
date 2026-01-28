# BBP Backend Setup Guide

## 📋 สิ่งที่ได้ทำไปแล้ว

### 1. Environment Variables

- ✅ สร้าง `.env.local` พร้อม Supabase credentials
- ✅ สร้าง `.env.example` สำหรับ template

### 2. Database Schema

- ✅ สร้าง `supabase/schema.sql` ที่รวมทุกอย่าง:
  - 11 ตาราง (customers, pets, services, bookings, pos_orders, ฯลฯ)
  - Indexes สำหรับ performance
  - Triggers สำหรับ auto-update timestamps
  - RLS Policies สำหรับ security
  - Views สำหรับ reporting
  - Functions สำหรับ generate order numbers

### 3. Supabase Client

- ✅ ติดตั้ง `@supabase/supabase-js`
- ✅ สร้าง `lib/supabase.ts` พร้อม:
  - `supabase` - สำหรับ client-side
  - `supabaseAdmin` - สำหรับ server-side (bypass RLS)
  - Database TypeScript types

### 4. API Routes

สร้าง RESTful APIs สำหรับ:

#### Customers API

- `GET /api/customers` - ดึงรายชื่อลูกค้า (support search)
- `POST /api/customers` - สร้างลูกค้าใหม่
- `GET /api/customers/[id]` - ดึงข้อมูลลูกค้า + สัตว์เลี้ยง
- `PATCH /api/customers/[id]` - อัพเดทข้อมูลลูกค้า
- `DELETE /api/customers/[id]` - ลบลูกค้า

#### Pets API

- `GET /api/pets` - ดึงรายการสัตว์เลี้ยง (filter by customerId)
- `POST /api/pets` - เพิ่มสัตว์เลี้ยงใหม่
- `GET /api/pets/[id]` - ดึงข้อมูลสัตว์เลี้ยง + เจ้าของ
- `PATCH /api/pets/[id]` - อัพเดทข้อมูลสัตว์เลี้ยง
- `DELETE /api/pets/[id]` - ลบสัตว์เลี้ยง

#### Services API

- `GET /api/services` - ดึงรายการบริการ + ราคา (support ?active=true)
- `POST /api/services` - สร้างบริการใหม่ พร้อมราคา
- `GET /api/services/[id]` - ดึงข้อมูลบริการ + ราคา
- `PATCH /api/services/[id]` - อัพเดทบริการและราคา
- `DELETE /api/services/[id]` - ลบบริการ

#### Configuration API

- `GET /api/config/pet-types` - ดึงรายการประเภทสัตว์
- `POST /api/config/pet-types` - สร้างประเภทสัตว์ใหม่
- `PATCH /api/config/pet-types` - อัพเดทประเภทสัตว์

- `GET /api/config/pet-sizes` - ดึงรายการไซต์ (filter by petTypeId)
- `POST /api/config/pet-sizes` - สร้างไซต์ใหม่
- `PATCH /api/config/pet-sizes` - อัพเดทไซต์
- `DELETE /api/config/pet-sizes` - ลบไซต์

---

## 🚀 ขั้นตอนการ Setup

### Step 1: Run SQL Schema ใน Supabase

1. เข้า [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจค `zpdowawkpbejrcxaefvl`
3. ไปที่ **SQL Editor**
4. Copy ทั้งหมดจากไฟล์ `supabase/schema.sql`
5. Paste และกด **Run** (F5)
6. ตรวจสอบว่า:
   - ✅ Tables ถูกสร้างครบ 11 ตาราง
   - ✅ มีข้อมูล default (DOG, CAT + sizes)
   - ✅ ไม่มี error

### Step 2: ตรวจสอบ Environment Variables

ไฟล์ `.env.local` ได้ถูกสร้างพร้อม credentials แล้ว ตรวจสอบว่ามี:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Step 3: Test API (Optional)

สามารถทดสอบ API ด้วย:

```bash
# Start dev server
npm run dev

# Test get pet types
curl http://localhost:3000/api/config/pet-types

# Test get sizes
curl http://localhost:3000/api/config/pet-sizes?petTypeId=DOG

# Test get services
curl http://localhost:3000/api/services?active=true
```

---

## 📊 Database Schema Overview

```
customers (ลูกค้า)
  ├─ pets (สัตว์เลี้ยง)
  ├─ bookings (การจอง)
  └─ pos_orders (คำสั่งซื้อ)

pet_type_configs (ประเภทสัตว์: หมา, แมว)
  └─ size_configs (ไซต์: XS, S, M, L, XL)

services (บริการ: อาบน้ำ, ตัดขน, ฯลฯ)
  └─ service_prices (ราคาตามประเภท+ไซต์)

pos_orders (คำสั่งซื้อ POS)
  ├─ pos_order_items (รายการสินค้า)
  └─ payments (การชำระเงิน)

promotions (โปรโมชั่น)
bookings (การจอง)
```

---

## 🔐 Security Features

- **RLS (Row Level Security)**: เปิดใช้งานทุกตาราง
- **Service Role**: ใช้ `supabaseAdmin` สำหรับ API routes (bypass RLS)
- **Anon Key**: ใช้ `supabase` สำหรับ client-side (จำกัดสิทธิ์)
- **Validation**: มี CHECK constraints ใน database level

---

## 📁 โครงสร้างไฟล์ที่สร้างใหม่

```
f:\github\bbp-front\
├── .env.local                          # Environment variables (DON'T COMMIT)
├── .env.example                        # Template สำหรับ env
├── lib/
│   └── supabase.ts                     # Supabase clients + types
├── supabase/
│   └── schema.sql                      # Database schema
└── app/
    └── api/
        ├── customers/
        │   ├── route.ts                # GET, POST /api/customers
        │   └── [id]/
        │       └── route.ts            # GET, PATCH, DELETE /api/customers/[id]
        ├── pets/
        │   ├── route.ts                # GET, POST /api/pets
        │   └── [id]/
        │       └── route.ts            # GET, PATCH, DELETE /api/pets/[id]
        ├── services/
        │   ├── route.ts                # GET, POST /api/services
        │   └── [id]/
        │       └── route.ts            # GET, PATCH, DELETE /api/services/[id]
        └── config/
            ├── pet-types/
            │   └── route.ts            # GET, POST, PATCH /api/config/pet-types
            └── pet-sizes/
                └── route.ts            # GET, POST, PATCH, DELETE /api/config/pet-sizes
```

---

## 🎯 ขั้นตอนถัดไป

1. **Run Schema ใน Supabase** (สำคัญที่สุด!)
2. **ทดสอบ API** ด้วย curl หรือ Postman
3. **สร้าง API Routes เพิ่มเติม**:
   - Bookings API
   - POS Orders API
   - Promotions API
   - Payments API
   - Dashboard Stats API
4. **เชื่อมต่อหน้าบ้านกับ API**:
   - แทนที่ Zustand mock data ด้วย API calls
   - ใช้ React Query หรือ SWR สำหรับ data fetching
   - เพิ่ม loading states และ error handling

---

## 💡 Tips

### Deploy บน Vercel

เมื่อ deploy ต้องเพิ่ม Environment Variables ใน Vercel Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### ใช้ Supabase Dashboard

- **Table Editor**: ดูและแก้ไขข้อมูลได้โดยตรง
- **SQL Editor**: Run queries และ test
- **Database**: ดู schema, relationships, indexes
- **API Docs**: Auto-generated API documentation

### Performance

- ใช้ indexes ที่สร้างไว้แล้ว
- ใช้ `select()` เฉพาะ columns ที่ต้องการ
- ใช้ pagination สำหรับ large datasets
- Enable caching ด้วย React Query

---

## ✅ สรุป

ได้ทำการออกแบบและสร้างระบบหลังบ้านเรียบร้อยแล้ว:

- ✅ Database schema ครบถ้วน (11 tables + views + functions)
- ✅ Environment setup พร้อม Supabase credentials
- ✅ Supabase client library ติดตั้งและพร้อมใช้งาน
- ✅ API routes สำหรับ Customers, Pets, Services, Configurations

**ขั้นตอนถัดไป**: Run schema ใน Supabase แล้วเริ่มเชื่อมต่อหน้าบ้าน!
