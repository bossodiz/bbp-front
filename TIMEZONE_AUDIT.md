# Timezone Audit — สรุปปัญหาทั้งโปรเจค

## เป้าหมาย (Target Convention)
- **DB**: เก็บ **UTC จริง** (เช่น 14:00 ไทย = `07:00+00` ใน DB)
- **Frontend**: แสดงเป็น **Bangkok local time** (UTC+7)
- **Input**: User กรอก Bangkok time → แปลงเป็น UTC ก่อนส่ง API

---

## สถานะปัจจุบัน: ❌ มี 2 Convention ปนกัน

ตอนนี้มี **2 แบบปน** ทำให้ข้อมูลผิด:

| Convention | ที่ใช้ | ผลลัพธ์ |
|---|---|---|
| **Bangkok-as-UTC** (เก็บเวลาไทยเป็น UTC) | `sales.created_at` DEFAULT, API override +7h | 14:00 ไทย → เก็บ `14:00+00` |
| **Real UTC** (เก็บ UTC จริง) | ตารางอื่นทั้งหมด, RPC `NOW()`, triggers | 14:00 ไทย → เก็บ `07:00+00` |

### ผลกระทบที่เกิดขึ้น:
- Dashboard query ใช้ real UTC boundaries (Bangkok midnight = `17:00Z วันก่อน`)
- แต่ `sales.created_at` เก็บ Bangkok-as-UTC
- **ทำให้ sales หลัง 17:00 ไทย ไม่โผล่ในรายงานวันนั้น** → ไปโผล่วันถัดไปแทน

---

## 1. Schema & RPC (Database Layer)

### 1.1 Column Defaults

| Table | Column | Default | สถานะ | ต้องแก้ |
|---|---|---|---|---|
| `sales` | `created_at` | `TIMEZONE('Asia/Bangkok', NOW())` | ❌ Bangkok-as-UTC | เปลี่ยนเป็น `NOW()` |
| `customers` | `created_at` | `NOW()` | ✅ UTC | - |
| `pets` | `created_at` | `NOW()` | ✅ UTC | - |
| `bookings` | `created_at` | `NOW()` | ✅ UTC | - |
| `bookings` | `booking_date` | DATE (ไม่มี TZ) | ✅ OK | - |
| `bookings` | `booking_time` | TIME (ไม่มี TZ) | ✅ OK | - |
| `promotions` | `start_date` / `end_date` | DATE | ✅ OK | - |
| ตารางอื่นทั้งหมด | `created_at` / `updated_at` | `NOW()` | ✅ UTC | - |

### 1.2 RPC Functions

| Function | `created_at` ใช้อะไร | สถานะ | ต้องแก้ |
|---|---|---|---|
| `create_sale_with_items` (migration 003) | ไม่ได้ระบุ → ใช้ column DEFAULT | ❌ ได้ Bangkok-as-UTC | ระบุ `NOW()` ชัดเจน |
| `checkout_hotel_booking` (migration 006) | `NOW()` ชัดเจน | ✅ UTC | - |
| `create_booking_with_pets` | ไม่ได้ใส่ `created_at` → DEFAULT `NOW()` | ✅ UTC | - |
| `update_updated_at_column()` trigger | `NOW()` | ✅ UTC | - |

### 1.3 DB View

| View | ปัญหา | ต้องแก้ |
|---|---|---|
| `dashboard_stats` | ใช้ `DATE(created_at) = CURRENT_DATE` | ถ้าเป็น UTC จะถูกอยู่แล้ว (Supabase server เป็น UTC) |

---

## 2. API Routes (Server Layer)

### 2.1 WRITE — บันทึกวันเวลาลง DB

| Route | ปัจจุบัน | สถานะ | ต้องแก้ |
|---|---|---|---|
| `api/sales/route.ts` POST | บวก +7h ให้ `saleDate` ก่อน update `created_at` | ❌ Bangkok-as-UTC | **ลบ +7h ออก** ส่ง UTC ตรงๆ |
| `api/hotel/[id]/checkout/route.ts` POST | บวก +7h เหมือนกัน | ❌ Bangkok-as-UTC | **ลบ +7h ออก** |
| `api/bookings/[id]/route.ts` PUT | `updated_at: new Date().toISOString()` | ✅ UTC | - |
| `api/promotions/[id]/route.ts` PUT | `updated_at: new Date().toISOString()` | ✅ UTC | - |

### 2.2 READ — Query วันเวลาจาก DB

| Route | ปัจจุบัน | สถานะ (ถ้า DB เป็น UTC) | ต้องแก้ |
|---|---|---|---|
| `api/dashboard/stats/route.ts` | `toUtcIsoFromBangkokLocal()` | ✅ ถูก | - |
| `api/dashboard/revenue-chart/route.ts` | `toUtcIsoFromBangkokLocal()` | ✅ ถูก | - |
| `api/dashboard/pet-service-chart/route.ts` | `toUtcIsoFromBangkokLocal()` | ✅ ถูก | - |
| `api/dashboard/route.ts` | `toUtcIsoFromBangkokLocal()` | ✅ ถูก | - |
| `api/dashboard/today-bookings/route.ts` | Bangkok date สำหรับ `booking_date` (DATE) | ✅ ถูก | - |
| `api/sales/route.ts` GET | รับ startDate/endDate จาก frontend | ⚠️ ขึ้นกับ frontend | - |

---

## 3. Frontend — แสดงผลวันเวลา (Display)

### 3.1 Components ที่แสดง `created_at` จาก `sales`

| Component | ฟีเจอร์ | ปัจจุบัน | สถานะ (ถ้า DB เป็น UTC) | ต้องแก้ |
|---|---|---|---|---|
| `service-history-list.tsx` | `formatDateTime()` | `timeZone: "UTC"` | ❌ จะแสดง UTC ไม่ใช่ Bangkok | เปลี่ยนเป็น `timeZone: "Asia/Bangkok"` |
| `pet-service-chart.tsx` | จัดกลุ่ม sale ตามวัน/เดือน | `new Date(sale.createdAt)` + browser local `setHours` | ⚠️ อาจผิดถ้า browser ≠ Bangkok | ใช้ Bangkok timezone ชัดเจน |
| `use-sales.ts` | comment "เป็น UTC+7 อยู่แล้ว" | ❌ comment ผิด | ลบ comment |

### 3.2 Components ที่แสดง `booking_date` (DATE column — ไม่มี TZ issue)

| Component | สถานะ | ต้องแก้ |
|---|---|---|
| `booking-list.tsx` | ✅ ถูก (DATE ไม่มี TZ) | - |
| `booking-calendar.tsx` | ✅ ถูก | - |
| `recent-bookings.tsx` | ✅ ถูก (แสดง booking_time) | - |
| `hotel-booking-list.tsx` | ✅ ถูก (check_in_date เป็น DATE) | - |

### 3.3 Components ที่แสดง clock/เวลาปัจจุบัน

| Component | ปัจจุบัน | สถานะ | ต้องแก้ |
|---|---|---|---|
| `recent-bookings.tsx` | `new Date()` browser local → `getHours()` | ✅ ถูก (browser ไทย) | - |

---

## 4. Frontend — Input วันเวลา (User กรอก)

| Component | Input | ส่งยังไง | สถานะ (ถ้า DB เป็น UTC) | ต้องแก้ |
|---|---|---|---|---|
| `pos-cart.tsx` saleDate picker | User เลือกวัน+เวลา local | `saleDate.toISOString()` (UTC) | ✅ ถูก | - |
| `pos-cart.tsx` checkOutDate | local date components | `YYYY-MM-DD` string | ✅ ถูก (DATE column) | - |
| `booking-dialog.tsx` | เลือกวัน/เวลา | bookingDate เป็น DATE, bookingTime เป็น TIME | ✅ ถูก | - |
| `hotel-booking-dialog.tsx` | เลือกวัน check-in | DATE string | ✅ ถูก | - |
| `service-history-list.tsx` dateRange | date filter → `getBangkokMidnightUtc()` | ISO UTC string | ✅ ถูก | - |

---

## 5. Utility Functions (`lib/utils.ts`)

| Function | ปัจจุบัน | สถานะ | ต้องแก้ |
|---|---|---|---|
| `toUtcIsoFromBangkokLocal()` | Bangkok components → UTC ISO | ✅ ถูก | - |
| `getBangkokDate()` | `toLocaleString` → Bangkok Date | ✅ ถูก | - |
| `getBangkokDateString()` | Bangkok `YYYY-MM-DD` | ✅ ถูก | - |
| `getBangkokDateTime()` | `getBangkokDate().toISOString()` | ❌ **Bug**: `.toISOString()` บน Date ที่สร้างจาก `toLocaleString` จะไม่ได้ UTC ที่ถูกต้อง | แก้หรือลบถ้าไม่ได้ใช้ |
| `formatDateToBangkok()` | แปลง date → Bangkok `YYYY-MM-DD` | ✅ ถูก | - |
| `convertUTCToBangkok()` | UTC → Bangkok Date | ✅ ถูก | - |

---

## 6. สรุปสิ่งที่ต้องแก้ทั้งหมด

### 🔴 ต้องแก้ (จะทำให้ข้อมูลผิด)

1. **Schema** — `sales.created_at` DEFAULT เปลี่ยนจาก `TIMEZONE('Asia/Bangkok', NOW())` เป็น `NOW()`
2. **RPC `create_sale_with_items`** (migration 003) — เพิ่ม `created_at = NOW()` ใน INSERT ชัดเจน
3. **`api/sales/route.ts` POST** — ลบ +7h ออก ส่ง `saleDate` ตรงๆ เป็น UTC
4. **`api/hotel/[id]/checkout/route.ts` POST** — ลบ +7h ออก
5. **`service-history-list.tsx` `formatDateTime()`** — เปลี่ยน `timeZone: "UTC"` เป็น `timeZone: "Asia/Bangkok"`

### 🟡 ควรแก้ (อาจผิดในบาง edge case)

6. **`pet-service-chart.tsx`** — ใช้ Bangkok timezone ชัดเจนแทน `setHours(0,0,0,0)` ของ browser
7. **`use-sales.ts`** — ลบ comment ผิดๆ "ข้อมูลจาก DB เป็น UTC+7 อยู่แล้ว"
8. **`lib/utils.ts` `getBangkokDateTime()`** — แก้ bug หรือลบถ้าไม่ได้ใช้

### ⚠️ ข้อมูลเก่าใน DB

- ข้อมูล `sales.created_at` ที่เก็บไปแล้วเป็น Bangkok-as-UTC
- ต้อง **migrate ข้อมูลเก่า**: ลบ 7 ชั่วโมงออกจาก `sales.created_at` ทุก row
- SQL: `UPDATE sales SET created_at = created_at - INTERVAL '7 hours';`

---

## Flow Diagram (หลังแก้)

```
User เลือก 14:00 ไทย
    ↓
Browser: saleDate = Date("2026-03-14T14:00") 
    ↓
.toISOString() = "2026-03-14T07:00:00.000Z"  (UTC)
    ↓
API: update created_at = "2026-03-14T07:00:00.000Z"
    ↓
DB stores: 2026-03-14T07:00:00+00  (UTC)
    ↓
Frontend reads: "2026-03-14T07:00:00+00"
    ↓
Intl.DateTimeFormat({ timeZone: "Asia/Bangkok" })
    ↓
แสดง: "14 มี.ค. 2569 14:00"  ✅
```
