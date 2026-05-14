# โครงการจัดการสปาสัตว์เลี้ยง (BPP Project)

## 📋 ภาพรวมโครงการ

เป็นระบบจัดการบริหารธุรกิจสปาสัตว์เลี้ยงแบบครบวงจร สำหรับจัดเก็บข้อมูลสมาชิก สัตว์เลี้ยง และจัดการการบริการต่างๆ เช่น การอาบน้ำ ตัดขน การจองโรงแรม ระบบขายหน้าร้าน และระบบส่งเสริมการขาย

---

## 🏗️ สถาปัตยกรรมเทคโนโลยี

### Backend & Framework
- **Framework**: Next.js 16.0.10
- **Runtime**: Node.js
- **API**: RESTful API จาก Next.js App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom Auth System with Login/Logout

### Frontend & UI
- **Language**: React 19.2.0 + TypeScript
- **Styling**: TailwindCSS 4.1.9 + PostCSS
- **Component Library**: Radix UI (ทั้งหมด ~20+ components)
- **Form Management**: React Hook Form + Zod Validation
- **State Management**: Zustand 5.0.10
- **Charts/Analytics**: Recharts 2.15.4
- **Date Handling**: date-fns 4.1.0
- **UI/UX**: Sonner (Toast), Lucide React (Icons)

---

## 📱 ระบบและฟีเจอร์หลัก

### 1️⃣ ระบบจัดการสมาชิก (Customer Management)
**Route**: `/customers`

**ความสามารถ**:
- เพิ่ม/แก้ไข/ลบข้อมูลสมาชิก
- จัดเก็บข้อมูลทั่วไป (ชื่อ, เบอร์โทร, ที่อยู่, อีเมล)
- เสมือนข้อมูลสมาชิกผ่าน Supabase
- ดูประวัติการใช้บริการของแต่ละสมาชิก
- ค้นหา/กรองข้อมูลสมาชิก

**API Routes**:
- `POST/GET /api/customers` - สร้าง/ดึงข้อมูลสมาชิก
- `PUT/DELETE /api/customers/[id]` - อัปเดต/ลบข้อมูลสมาชิก

**Hooks**: `useCustomers()` - จัดการ CRUD สมาชิก

---

### 2️⃣ ระบบจัดการข้อมูลสัตว์เลี้ยง (Pet Management)
**Route**: รวมอยู่ใน `/customers` (pet profiles)

**ความสามารถ**:
- เพิ่มสัตว์เลี้ยงของสมาชิก
- จัดเก็บข้อมูล: ชื่อ, ประเภท, สายพันธุ์, น้ำหนัก, อายุ, หมายเลขชิป
- เชื่อมโยงสัตว์เลี้ยงกับสมาชิก
- บันทึกประวัติการบริการแต่ละตัว

**API Routes**:
- `POST/GET /api/pets` - สร้าง/ดึงข้อมูลสัตว์เลี้ยง
- `PUT/DELETE /api/pets/[id]` - อัปเดต/ลบข้อมูลสัตว์เลี้ยง
- `GET /api/breeds` - ดึงข้อมูลสายพันธุ์สัตว์เลี้ยง
- `GET /api/config/pet-types` - ประเภทสัตว์เลี้ยง
- `GET /api/config/pet-sizes` - ขนาดสัตว์เลี้ยง

**Hooks**: 
- `usePets()` - จัดการข้อมูลสัตว์เลี้ยง
- `useBreeds()` - ดึงข้อมูลสายพันธุ์
- `useServiceConfig()` - ดึง config สัตว์เลี้ยง

---

### 3️⃣ ระบบจองคิวบริการอาบน้ำตัดขน (Service Booking)
**Route**: `/bookings`

**ความสามารถ**:
- จองบริการอาบน้ำ/ตัดขนสำหรับสัตว์เลี้ยง
- เลือกวัน เวลา และประเภทบริการ
- เลือกพนักงาน/ผู้บริการ
- จัดการสถานะการจอง (pending, confirmed, completed, cancelled)
- ดูปฏิทินจองคิวรายวัน
- สร้าง/อัปเดต/ยกเลิกการจอง

**API Routes**:
- `POST/GET /api/bookings` - สร้าง/ดึงข้อมูลการจอง
- `PUT/DELETE /api/bookings/[id]` - อัปเดต/ยกเลิกการจอง
- `GET /api/services` - ดึงรายการบริการที่มี
- `POST/GET /api/services` - จัดการบริการ

**Hooks**: 
- `useBookings()` - จัดการการจอง
- `useTodayBookings()` - ดึงการจองในวันนี้
- `useServices()` - ดึงรายการบริการ

---

### 4️⃣ ระบบจองโรงแรมสัตว์เลี้ยง (Hotel Management)
**Route**: `/hotel`

**ความสามารถ**:
- จองห้องโรงแรมสำหรับสัตว์เลี้ยง
- เลือกห้อง ประเภทห้อง และช่วงวันที่
- จัดการเช็คอิน/เช็คเอาต์
- จัดการราคาและค่าใช้บริการเพิ่มเติม
- บันทึกสถานะห้อง
- ผลิตใบเสร็จรับเงินตอนเช็คเอาต์

**API Routes**:
- `POST/GET /api/hotel` - สร้าง/ดึงข้อมูลการจองโรงแรม
- `PUT/DELETE /api/hotel/[id]` - อัปเดต/ยกเลิกการจอง
- `POST /api/hotel/[id]/checkout` - ประมวลผลการเช็คเอาต์

**Hooks**: `useHotel()` - จัดการการจองโรงแรม

---

### 5️⃣ ระบบ POS ขายสินค้า (Point of Sale)
**Route**: `/pos`

**ความสามารถ**:
- สร้างใบขายสินค้า/บริการ
- เพิ่มสินค้าจากรายการสินค้า
- คำนวณอัตราส่วนลด (ส่วนแบ่งร้อยละ หรือจำนวนเงินคงที่)
- เลือกวิธีชำระเงิน (สด บัตรเครดิต โอนเงิน)
- พิมพ์ใบเสร็จรับเงิน
- บันทึกประวัติการขาย
- ค้นหาประวัติการขายจากวันที่หรือสมาชิก

**API Routes**:
- `POST/GET /api/sales` - สร้าง/ดึงข้อมูลการขาย
- `PUT/DELETE /api/sales/[id]` - อัปเดต/ลบการขาย

**Hooks**: `useSales()` - จัดการข้อมูลการขาย

---

### 6️⃣ ระบบจัดการสินค้า (Product Management)
**Route**: `/products`

**ความสามารถ**:
- เพิ่ม/แก้ไข/ลบสินค้า
- จัดเก็บข้อมูลสินค้า: ชื่อ, ราคา, หมวดหมู่, คำอธิบาย
- จัดการสต็อกสินค้า
- บันทึกข้อมูลผู้ขาย/ผู้จัดจำหน่าย
- ค้นหา/กรองสินค้า

**API Routes**:
- `POST/GET /api/products` - สร้าง/ดึงข้อมูลสินค้า
- `PUT/DELETE /api/products/[id]` - อัปเดต/ลบสินค้า

**Hooks**: `useProducts()` - จัดการสินค้า

---

### 7️⃣ ระบบส่งเสริมการขาย (Promotions)
**Route**: `/promotions`

**ความสามารถ**:
- สร้างโปรโมชั่น/ส่วนลด/แคมเปญ
- กำหนดประเภทส่วนลด (ร้อยละ หรือจำนวนเงินคงที่)
- กำหนดวันที่เริ่ม/สิ้นสุดโปรโมชั่น
- เลือกสินค้าหรือบริการที่ใช้โปรโมชั่น
- จัดการเงื่อนไขการใช้โปรโมชั่น
- ติดตามการใช้โปรโมชั่น

**API Routes**:
- `POST/GET /api/promotions` - สร้าง/ดึงข้อมูลโปรโมชั่น
- `PUT/DELETE /api/promotions/[id]` - อัปเดต/ลบโปรโมชั่น

**Hooks**: `usePromotions()` - จัดการโปรโมชั่น

---

### 8️⃣ Dashboard และการวิเคราะห์ (Dashboard & Analytics)
**Route**: `/` (หน้าแรก)

**ความสามารถ**:
- **แสดงสถิติรวม**:
  - จำนวนสมาชิกทั้งหมด
  - จำนวนการจองวันนี้
  - รายได้รวมวันนี้/เดือนนี้
  - สัตว์เลี้ยงที่ลงทะเบียน

- **กราฟและแผนภูมิ**:
  - แผนภูมิรายได้ (Revenue Chart)
  - แผนภูมิบริการที่ได้รับความนิยม (Pet Service Chart)
  - สมาชิกอันดับต้น (Top Customers)
  - การจองในวันนี้ (Today Bookings)

- **Widgets**:
  - แสดงข้อมูลแบบเรียลไทม์
  - อัปเดตอัตโนมัติ

**API Routes**:
- `GET /api/dashboard` - ข้อมูลแดชบอร์ดรวม
- `GET /api/dashboard/stats` - สถิติทั่วไป
- `GET /api/dashboard/revenue-chart` - ข้อมูลรายได้
- `GET /api/dashboard/pet-service-chart` - ข้อมูลบริการสัตว์เลี้ยง
- `GET /api/dashboard/top-customers` - สมาชิกอันดับต้น
- `GET /api/dashboard/today-bookings` - การจองวันนี้

**Hooks**: 
- `useDashboard()` - ข้อมูลแดชบอร์ดรวม
- `useDashboardStats()` - สถิติ
- `useRevenueChart()` - กราฟรายได้
- `usePetServiceChart()` - กราฟบริการสัตว์เลี้ยง
- `useTopCustomers()` - สมาชิกอันดับต้น
- `useTodayBookings()` - การจองวันนี้

---

### 9️⃣ ระบบประวัติ (History)
**Route**: `/history`

**ความสามารถ**:
- ดูประวัติการจองทั้งหมด
- ดูประวัติการขายสินค้า
- ดูประวัติการใช้โปรโมชั่น
- ค้นหาประวัติตามวันที่/สมาชิก/บริการ
- ส่งออกรายงาน
- วิเคราะห์ข้อมูลประวัติ

---

## 🔐 ระบบการยืนยันตัวตน (Authentication)

**Route**: `/login`

**ความสามารถ**:
- เข้าสู่ระบบด้วยชื่อผู้ใช้/รหัสผ่าน
- ออกจากระบบ
- ตรวจสอบการเข้าสู่ระบบ
- ข้อมูลผู้ใช้ปัจจุบัน

**API Routes**:
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ

**Auth System**:
- JWT Token (เก็บใน HTTP-only cookies)
- Session Management ผ่าน Supabase

---

## 🎨 UI Components & UI Library

**Radix UI Components Used** (20+ components):
- Dialog, Alert Dialog, Accordion, Avatar
- Checkbox, Radio Group, Select, Switch, Toggle
- Dropdown Menu, Context Menu, Navigation Menu
- Tabs, Tooltip, Popover, Hover Card
- Progress, Slider, Separator, Scroll Area
- และอื่นๆ

**Custom Components**:
- DataTable/Grid สำหรับแสดงข้อมูล
- Modal/Dialog สำหรับฟอร์ม
- Charts/Charts สำหรับกราฟ
- Sidebar Navigation
- Breadcrumb Navigation

---

## 💾 State Management

**Zustand Store**:
- จัดการสถานะแอปพลิเคชัน
- Session/User State
- UI State (modals, toasts, etc.)
- Theme State

**Context API**:
- ServiceConfigContext - สำหรับ config สัตว์เลี้ยง

---

## 🔌 Hooks & Custom Hooks

**Data Fetching Hooks**:
- `useCustomers()` - สมาชิก
- `usePets()` - สัตว์เลี้ยง
- `useBookings()` - การจองบริการ
- `useHotel()` - โรงแรม
- `useProducts()` - สินค้า
- `usePromotions()` - โปรโมชั่น
- `useSales()` - การขาย
- `useServices()` - บริการ

**Dashboard Hooks**:
- `useDashboard()` - ข้อมูลแดชบอร์ดรวม
- `useDashboardStats()` - สถิติ
- `useRevenueChart()` - กราฟรายได้
- `usePetServiceChart()` - กราฟบริการ
- `useTopCustomers()` - สมาชิกอันดับต้น
- `useTodayBookings()` - การจองวันนี้

**Config Hooks**:
- `useBreeds()` - สายพันธุ์สัตว์เลี้ยง
- `useServiceConfig()` - Config บริการ

---

## 📁 โครงสร้างไฟล์

```
bbp-front/
├── app/
│   ├── (dashboard)/          # หน้าแดชบอร์ด
│   │   ├── bookings/         # หน้าการจอง
│   │   ├── customers/        # หน้าสมาชิก
│   │   ├── history/          # หน้าประวัติ
│   │   ├── hotel/            # หน้าโรงแรม
│   │   ├── pos/              # หน้า POS
│   │   ├── products/         # หน้าสินค้า
│   │   ├── promotions/       # หน้าโปรโมชั่น
│   │   ├── services/         # หน้าบริการ
│   │   └── page.tsx          # หน้าแดชบอร์ดแรก
│   ├── api/                  # API Routes
│   │   ├── auth/             # Authentication API
│   │   ├── bookings/         # Bookings API
│   │   ├── customers/        # Customers API
│   │   ├── pets/             # Pets API
│   │   ├── hotel/            # Hotel API
│   │   ├── products/         # Products API
│   │   ├── promotions/       # Promotions API
│   │   ├── services/         # Services API
│   │   ├── sales/            # Sales API
│   │   ├── dashboard/        # Dashboard API
│   │   ├── breeds/           # Breeds API
│   │   └── config/           # Config API
│   ├── login/                # Login Page
│   └── layout.tsx            # Root Layout
├── components/
│   ├── auth/                 # Auth Components
│   ├── bookings/             # Booking Components
│   ├── customers/            # Customer Components
│   ├── dashboard/            # Dashboard Components
│   ├── history/              # History Components
│   ├── hotel/                # Hotel Components
│   ├── pos/                  # POS Components
│   ├── products/             # Product Components
│   ├── promotions/           # Promotion Components
│   ├── services/             # Service Components
│   └── ui/                   # Radix UI Components
├── lib/
│   ├── hooks/                # Custom Hooks
│   ├── contexts/             # React Contexts
│   ├── auth.ts               # Authentication Utilities
│   ├── supabase.ts           # Supabase Configuration
│   ├── store.ts              # Zustand Store
│   └── dashboard-revenue.ts  # Dashboard Utilities
├── hooks/                    # Root Hooks
├── package.json              # Dependencies
└── next.config.mjs           # Next.js Configuration
```

---

## 🔄 ลำดับการทำงาน (Workflow)

### ลำดับสมาชิก + สัตว์เลี้ยง:
1. สมาชิกมาลงทะเบียนในระบบ
2. เพิ่มข้อมูลสัตว์เลี้ยง (ชื่อ, พันธุ์, น้ำหนัก, เป็นต้น)
3. สัตว์เลี้ยงพร้อมสำหรับการจองบริการ

### ลำดับการจองบริการ:
1. เลือกสมาชิก → เลือกสัตว์เลี้ยง → เลือกบริการ
2. กำหนดวันเวลา → เลือกพนักงาน → ยืนยันการจอง
3. สถานะการจอง: Pending → Confirmed → Completed

### ลำดับการจองโรงแรม:
1. เลือกสมาชิก → เลือกสัตว์เลี้ยง
2. เลือกห้อง → เลือกวันเข้า/ออก
3. ยืนยันการจอง → ทำการเช็คอิน → ทำการเช็คเอาต์ → สร้างใบเสร็จ

### ลำดับการขาย (POS):
1. สร้างใบขายใหม่
2. เลือกสมาชิก (ถ้ามี)
3. เพิ่มสินค้า/บริการ → กำหนดปริมาณ → คำนวณราคา
4. เลือกส่วนลด (ถ้ามี) → เลือกวิธีชำระเงิน
5. พิมพ์ใบเสร็จ → สิ้นสุดการขาย

---

## 📊 ฐานข้อมูล (Database Schema - Supabase)

**Tables**:
- `customers` - ข้อมูลสมาชิก
- `pets` - ข้อมูลสัตว์เลี้ยง
- `pet_types` - ประเภทสัตว์เลี้ยง
- `pet_sizes` - ขนาดสัตว์เลี้ยง
- `breeds` - สายพันธุ์สัตว์เลี้ยง
- `services` - ข้อมูลบริการ
- `bookings` - ข้อมูลการจองบริการ
- `hotel_rooms` - ข้อมูลห้องโรงแรม
- `hotel_bookings` - ข้อมูลการจองโรงแรม
- `products` - ข้อมูลสินค้า
- `sales` - ข้อมูลการขาย (POS)
- `sale_items` - รายการสินค้าในการขาย
- `promotions` - ข้อมูลโปรโมชั่น
- `users` - ข้อมูลผู้ใช้ (สำหรับ auth)

---

## 🚀 การพัฒนาและติดตั้ง

### ขั้นตอนการติดตั้ง:
```bash
# Install dependencies
npm install

# Setup environment variables
# Create .env.local with Supabase credentials

# Run development server
npm run dev

# Build for production
npm build

# Start production server
npm start
```

### Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
```

---

## 🎯 เป้าหมายและการใช้งาน

**เป้าหมายหลัก**:
- ✅ จัดการข้อมูลสมาชิกและสัตว์เลี้ยง
- ✅ ระบบจองคิวบริการสปา
- ✅ ระบบจองโรงแรมสัตว์เลี้ยง
- ✅ ระบบขายหน้าร้าน (POS)
- ✅ ระบบส่งเสริมการขาย
- ✅ แดชบอร์ดและการวิเคราะห์ข้อมูล
- ✅ การจัดการประวัติและรายงาน

**ผู้ใช้หลัก**:
- เจ้าของธุรกิจ - ดูแดชบอร์ด, สถิติ, รายงาน
- พนักงานบริการ - จัดการการจอง, โรงแรม, POS
- สมาชิก/ลูกค้า - ดูประวัติการใช้บริการ (future feature)

---

## 📝 หมายเหตุพัฒนา

- โปรเจคนี้ใช้ Next.js 16 กับ React 19 (latest versions)
- ใช้ TypeScript สำหรับ type safety
- ใช้ Supabase สำหรับ backend as a service
- Design System ใช้ TailwindCSS + Radix UI
- State management ด้วย Zustand + Context API
- Form validation ด้วย Zod + React Hook Form

---

**Last Updated**: 2026-05-14  
**Version**: 0.1.0
