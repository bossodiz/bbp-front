# BPP Project — Agent Guidelines

ระบบจัดการสปาสัตว์เลี้ยงแบบครบวงจร (Boutique Pet & Parlor)  
Stack: **Next.js 16 · React 19 · TypeScript · Supabase · TailwindCSS 4 · Radix UI · Zustand**

---

## สิ่งที่ต้องทำก่อนเขียนโค้ดทุกครั้ง

1. ระบุว่างานนี้เกี่ยวกับ module ไหน (customers / pets / bookings / hotel / pos / products / promotions / dashboard)
2. ตรวจสอบ hook ที่มีอยู่แล้ว อย่าสร้างใหม่ถ้ามี
3. ใช้ pattern เดิมของโปรเจ็ค (ดูส่วน Conventions ด้านล่าง)
4. TypeScript เสมอ — ห้าม `any`

---

## Architecture Overview

```
app/
├── (dashboard)/          # Protected routes ทั้งหมด
│   ├── bookings/
│   ├── customers/        # รวม pet profiles ด้วย
│   ├── history/
│   ├── hotel/
│   ├── pos/
│   ├── products/
│   ├── promotions/
│   ├── services/
│   └── page.tsx          # Dashboard หน้าแรก
├── api/                  # Next.js Route Handlers
│   ├── auth/             # login / logout
│   ├── bookings/
│   ├── customers/
│   ├── pets/
│   ├── hotel/
│   ├── products/
│   ├── promotions/
│   ├── services/
│   ├── sales/            # ต้องมี CSRF token
│   ├── dashboard/        # stats / charts / top-customers / today-bookings
│   ├── breeds/
│   └── config/           # pet-types / pet-sizes
├── login/
└── layout.tsx

components/               # แยก folder ตาม module เดียวกับ app/
lib/
├── hooks/                # Custom hooks ทั้งหมด
├── contexts/             # React Contexts
├── auth.ts
├── supabase.ts
├── store.ts              # Zustand store
└── dashboard-revenue.ts
```

---

## Conventions

### API Routes (Route Handlers)

```ts
// Pattern มาตรฐานทุก route
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }

// URL params
export async function PUT(request: Request, { params }: { params: { id: string } }) { ... }
```

- ทุก endpoint ใช้ RESTful: `GET/POST /api/[resource]` และ `GET/PUT/DELETE /api/[resource]/[id]`
- Sales API ต้องตรวจ CSRF token ทุก mutating request
- Auth ใช้ JWT เก็บใน HTTP-only cookie

### Custom Hooks

```ts
// pattern ของทุก hook
export function useCustomers() {
  // fetch, loading, error state
  // CRUD functions
  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
```

Hook ที่มีอยู่แล้ว — **ใช้ต่อ อย่าสร้างซ้ำ**:

| Hook                   | ใช้สำหรับ           |
| ---------------------- | ------------------- |
| `useCustomers()`       | CRUD สมาชิก         |
| `usePets()`            | CRUD สัตว์เลี้ยง    |
| `useBreeds()`          | ดึงสายพันธุ์        |
| `useBookings()`        | CRUD การจองสปา      |
| `useTodayBookings()`   | การจองวันนี้        |
| `useServices()`        | รายการบริการ        |
| `useServiceConfig()`   | config สัตว์เลี้ยง  |
| `useHotel()`           | CRUD โรงแรม         |
| `useProducts()`        | CRUD สินค้า         |
| `usePromotions()`      | CRUD โปรโมชั่น      |
| `useSales()`           | CRUD การขาย         |
| `useDashboard()`       | ข้อมูลรวม dashboard |
| `useDashboardStats()`  | สถิติ               |
| `useRevenueChart()`    | กราฟรายได้          |
| `usePetServiceChart()` | กราฟบริการ          |
| `useTopCustomers()`    | สมาชิกอันดับต้น     |

### State Management

- **Zustand** (`lib/store.ts`) — global state: session, UI state (modals/toasts), theme
- **Context API** — `ServiceConfigContext` สำหรับ config สัตว์เลี้ยงเท่านั้น
- **Local state** (`useState`) — state ที่ใช้เฉพาะใน component นั้น

### UI Components

ใช้ Radix UI จาก `components/ui/` เสมอ อย่า implement primitive ซ้ำ  
Dialog, Select, Checkbox, Tabs, Tooltip, Popover, DropdownMenu ฯลฯ มีครบ ~20+ components

Toast ใช้ **Sonner**, Icons ใช้ **Lucide React**

### Forms

```ts
// React Hook Form + Zod เสมอ
const schema = z.object({ ... })
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
```

### Styling

- TailwindCSS 4 เท่านั้น ห้ามเขียน inline style ยกเว้นมีเหตุผลจำเป็น
- ห้าม hardcode สี ใช้ Tailwind color tokens

---

## Business Logic สำคัญ

### Booking Status Flow

```
pending → confirmed → completed
                   ↘ cancelled
```

### Hotel Flow

```
จอง → check-in → check-out → สร้างใบเสร็จ
POST /api/hotel/[id]/checkout  ← endpoint พิเศษ
```

### POS Payment Methods

```ts
type PaymentMethod = "CASH" | "QR" | "CREDIT_CARD";
```

### Discount Types (POS + Promotions)

- ร้อยละ (percentage)
- จำนวนเงินคงที่ (fixed amount)

### Customer → Pet Relationship

- 1 customer มีได้หลาย pets
- การจอง booking/hotel ต้องระบุทั้ง customer และ pet
- POS selector แสดงชื่อสัตว์เลี้ยงด้วย ไม่ใช่แค่ชื่อลูกค้า

---

## Database Tables (Supabase)

`customers` · `pets` · `pet_types` · `pet_sizes` · `breeds`  
`services` · `bookings`  
`hotel_rooms` · `hotel_bookings`  
`products` · `sales` · `sale_items`  
`promotions` · `users`

Supabase client อยู่ที่ `lib/supabase.ts` — import จากที่นี่เสมอ

---

## สิ่งที่ห้ามทำ

- ❌ ห้ามใช้ `any` ใน TypeScript
- ❌ ห้าม fetch ตรงใน component — ใช้ hook เสมอ
- ❌ ห้าม hardcode URL — ใช้ relative path `/api/...`
- ❌ ห้ามสร้าง hook ซ้ำกับที่มีอยู่แล้ว
- ❌ ห้าม mutate sales API โดยไม่มี CSRF token
- ❌ ห้าม implement Radix UI primitives ซ้ำ ใช้จาก `components/ui/` เลย

## Self-Maintenance Rules

หลังทำงานทุกครั้ง ให้ตรวจสอบว่ามีการเปลี่ยนแปลงที่กระทบไฟล์นี้ไหม:

- เพิ่ม hook ใหม่ → อัปเดตตาราง Hook
- เพิ่ม API route ใหม่ → อัปเดต Architecture
- เปลี่ยน business logic → อัปเดตส่วน Business Logic
- เพิ่ม table ใน Supabase → อัปเดต Database Tables

ถ้ามีการเปลี่ยนแปลง ให้แก้ AGENT.md ในครั้งเดียวกับที่แก้โค้ด

## เมื่อ dev แก้โค้ดเอง

ถ้า dev สั่งว่า "update AGENT.md" ให้:

1. อ่านไฟล์ที่เปลี่ยนแปลง
2. เปรียบเทียบกับสิ่งที่เขียนใน AGENT.md
3. แก้เฉพาะส่วนที่ไม่ตรงกัน
4. สรุปว่าแก้อะไรบ้าง

## Reference Files

- `AGENT.md` — conventions และ architecture
- `supabase-query.md` — schema จริงและ query patterns (อ่านก่อนเขียน query ทุกครั้ง)
