# Fast POS Feature Design

## 📋 Overview

ลดขั้นตอนการสร้างและทำรายการ POS สำหรับลูกค้าใหม่ โดยรวมการสร้างลูกค้า สัตว์เลี้ยง และเลือกบริการทั้งหมดไว้ในหนึ่งไฟล์

## 🎯 Problem Statement

**Current Flow (8+ steps):**

```
1. ไปที่หน้า Customers → 2. สร้างลูกค้า → 3. Add pet → 4. ไปหน้า POS
→ 5. เลือกลูกค้า → 6. เลือกสัตว์เลี้ยง → 7. เลือกบริการ → 8. กดจ่ายเงิน
```

**Time Cost:** ~2-3 minutes per new customer

## ✅ Solution Design

### Approach: Multi-Step Quick Transaction Modal

Create a **Fast POS Modal** that consolidates the entire flow into one modal dialog with 4 steps:

### Step-by-Step Flow with UI Mockups

## Step 1/4: ข้อมูลลูกค้า (Customer Information)

### Layout

```
┌────────────────────────────────────────────────────────┐
│ 🚀 Quick Transaction  [Progress: ████░░░░░░] 1/4       │ ← Header
├────────────────────────────────────────────────────────┤
│                                                        │
│  ข้อมูลลูกค้า                                         │
│  ──────────────────────────────────────────────────── │
│                                                        │
│  ชื่อลูกค้า *                                         │
│  ┌──────────────────────────────────────────────────┐│
│  │ [🔍 ค้นหา หรือสร้างใหม่........] ▼           ││ ← Autocomplete Dropdown
│  │  ┌─────────────────────────────────────────────┐││
│  │  │ 🐕 สมชาย วงศ์มี                            ││  Dropdown shows:
│  │  │   0812345678 | ขุณ, เมียว               │││  - Name
│  │  │ ┌─────────────────────────────────────────┐││  - Phone
│  │  │ 🐕 กิจศิลป์ วุ่นวาย                       ││  - Pet names
│  │  │   0898765432 | มิกกี้                    │││  (Sorted by recent)
│  │  │ ┌─────────────────────────────────────────┐││
│  │  │ + สร้างลูกค้าใหม่                        ││
│  │  └─────────────────────────────────────────────┘││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│  เบอร์โทรศัพท์                                        │
│  ┌──────────────────────────────────────────────────┐│
│  │ [                          ...................... ││ ← Input: tel (Optional)
│  │  Max 10 digits ]                                 ││    Auto-format: 081-2345678
│  └──────────────────────────────────────────────────┘│    If empty → auto 0000000000
│  ℹ️ ไม่บังคับ (ถ้าไม่กรอก จะใช้ 0000000000)        │
│                                                        │
│  🔍 Detection: ถ้ากรอกครบ 10 ตัว → ค้นหาข้อมูล   │
│  ┌──────────────────────────────────────────────────┐│
│  │ ✓ พบข้อมูล: สมชาย วงศ์มี                        ││
│  │ 🐕 สัตว์เลี้ยง: ขุณ (18kg), เมียว (5kg)        ││
│  │ [ใช้ลูกค้านี้]  [สร้างใหม่]                   ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│                             [ยกเลิก]  [ถัดไป >]     │ ← Buttons
│                                                        │
└────────────────────────────────────────────────────────┘
```

### UI Details

- **Name field (Autocomplete Dropdown):**
  - Type: Searchable dropdown (required)
  - Placeholder: "🔍 ค้นหา หรือสร้างใหม่"
  - Data source: GET `/api/customers?search={query}` (real-time search)
  - Display format per item:
    ```
    🐕 [Name] [Phone]
    [Pet1], [Pet2], ...
    ```
  - At bottom: "+ สร้างลูกค้าใหม่" option (if no match found)
  - Sorted by: Recent usage (last transaction date)
  - Behavior:
    - **If select existing customer:** Pre-fill phone + pets data → Jump to Step 2
    - **If select "สร้างใหม่":** Clear phone field → Continue Step 1

- **Phone field:**
  - Type: tel (optional)
  - Placeholder: "0812345678"
  - Max length: 10 digits
  - Auto-format: Insert dash after 3rd digit "081-2345678"
  - Helper: "ไม่บังคับ (ถ้าไม่กรอก จะใช้ 0000000000)"
  - Validation:
    - Empty → Allow (will auto-fill as 0000000000 on next)
    - 1-9 digits → Show as typing
    - 10 digits → Trigger phone detection (GET `/api/customers?phone={phone}`)
    - 0000000000 → Skip detection (don't call API)

- **Phone Detection Alert (Auto-show when 10 digits):**
  - If found: Show customer info card

  ```
  ┌────────────────────────────────────┐
  │ ✓ พบข้อมูลลูกค้า                  │
  │                                    │
  │ ชื่อ: สมชาย วงศ์มี                │
  │ เบอร์: 081-2345678                 │
  │ สัตว์: 🐕 ขุณ (18kg)              │
  │        🐈 เมียว (5kg)              │
  │                                    │
  │ [ใช้ลูกค้านี้]  [สร้างใหม่]      │
  └────────────────────────────────────┘
  ```

  - If not found: Just continue (allow new customer)

- **Buttons:**
  - "ยกเลิก": Close modal (+ confirm if data entered)
  - "ถัดไป":
    - Disabled until name filled (via dropdown selection)
    - Auto-fill phone as "0000000000" if empty

---

## Step 2/4: ข้อมูลสัตว์เลี้ยง (Pet Information)

### Layout

```
┌────────────────────────────────────────────────────────┐
│ 🚀 Quick Transaction  [Progress: ████████░░] 2/4       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  สัตว์เลี้ยง                                          │
│  ──────────────────────────────────────────────────── │
│                                                        │
│  🐕 Pet 1                                             │ ← Added pet card
│  ┌──────────────────────────────────────────────────┐│
│  │ ชื่อ: ขุณ                                        ││
│  │ ประเภท: 🐕 สุนัข (Dog)                           ││
│  │ พันธุ์: ไทยหลังอาน                                ││
│  │ น้ำหนัก: 18 kg                                    ││
│  │                            [แก้ไข] [ลบ]         ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│  📝 เพิ่มสัตว์เลี้ยงใหม่                              │
│  ┌──────────────────────────────────────────────────┐│
│  │ ชื่อ *                                           ││
│  │ ┌──────────────────────────────────────────────┐││
│  │ │ [                          ..................││ ││ Input: text
│  │ └──────────────────────────────────────────────┘││
│  │                                                  ││
│  │ ประเภท *                                        ││
│  │ ┌──────────────────────────────────────────────┐││
│  │ │ ◉ 🐕 สุนัข (Dog)  ○ 🐈 แมว (Cat)           ││ ││ Radio buttons call api
│  │ └──────────────────────────────────────────────┘││
│  │                                                  ││
│  │ พันธุ์ *                                         ││
│  │ ┌──────────────────────────────────────────────┐││
│  │ │ [▼ ไทยหลังอาน.................] ││ ││ Dropdown (filtered by type) call api
│  │ │   - ไทยหลังอาน                               │││
│  │ │   - ไทยแตงกวม                               │││
│  │ │   - ผสม (Mixed)                             │││
│  │ │   - อื่นๆ (Other)                           │││
│  │ └──────────────────────────────────────────────┘││
│  │                                                  ││
│  │ น้ำหนัก (กิโลกรัม)                               ││
│  │ ┌──────────────────────────────────────────────┐││
│  │ │ [                  18 .................] kg   ││ ││ Input: number
│  │ └──────────────────────────────────────────────┘││
│  │ ℹ️ สำหรับประมาณขนาดบริการ (ไม่บังคับ)            ││
│  │                                                  ││
│  │ [+ เพิ่มสัตว์เลี้ยง] [✓ เสร็จแล้ว]             ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│                             [< ย้อนกลับ]  [ถัดไป >]  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### UI Details

- **Added Pet Card:**
  - Show as read-only summary
  - 2 action buttons: [แก้ไข], [ลบ]
  - Can add multiple pets (each pet gets own card above)
  - Display icons: 🐕 or 🐈

- **Pet Form Section:**
  - Only show when adding new pet
  - Field: Name (required)
  - Field: Type (radio: Dog/Cat) → required, filters breed list (from API)
  - Field: Breed (dropdown, filters based on type) → required, fetched from `/api/breeds`
  - Field: Weight (optional number input)
  - Buttons: [+ เพิ่มสัตว์เลี้ยง] (add another pet), [✓ เสร็จแล้ว] (finish adding)

- **Pet Type Selection (Dynamic from API):**

  On Step 2 mount, fetch pet types:

  ```typescript
  const response = await fetch("/api/config/pet-types");
  const { data: petTypes } = await response.json();
  // petTypes are sorted by order_index
  ```

  **Example Response:**

  ```json
  [
    {
      "id": "DOG",
      "name": "สุนัข",
      "icon": "🐕",
      "order_index": 1,
      "active": true
    },
    {
      "id": "CAT",
      "name": "แมว",
      "icon": "🐈",
      "order_index": 2,
      "active": true
    }
  ]
  ```

  Display as radio buttons with icon + name:

  ```
  ◉ 🐕 สุนัข (Dog)  ○ 🐈 แมว (Cat)
  ```

  When user selects a pet type → immediately fetch breeds for that type from `/api/breeds?petTypeId={petTypeId}&active=true`

- **Breed Dropdown Logic (Dynamic from API):**

  When user selects pet type, fetch from API:

  ```typescript
  // On pet type change
  const petTypeId = selectedType; // "DOG" or "CAT"
  const response = await fetch(
    `/api/breeds?petTypeId=${petTypeId}&active=true`,
  );
  const breeds = await response.json();
  // breeds are sorted by order_index from API
  // Display as dropdown options
  ```

  **Example Response from API:**

  For DOG (pet_type_id: "DOG"):

  ```json
  [
    {
      "id": 1,
      "name": "ไทยหลังอาน",
      "pet_type_id": "DOG",
      "active": true,
      "order_index": 1
    },
    {
      "id": 2,
      "name": "ไทยแตงกวม",
      "pet_type_id": "DOG",
      "active": true,
      "order_index": 2
    },
    {
      "id": 3,
      "name": "แจ็ครัสเซล",
      "pet_type_id": "DOG",
      "active": true,
      "order_index": 3
    },
    {
      "id": 4,
      "name": "โกลเด้นเรทรีฟเวอร์",
      "pet_type_id": "DOG",
      "active": true,
      "order_index": 4
    },
    {
      "id": 5,
      "name": "ลาบราดอร์",
      "pet_type_id": "DOG",
      "active": true,
      "order_index": 5
    },
    {
      "id": 100,
      "name": "ผสม (Mixed)",
      "pet_type_id": "DOG",
      "active": true,
      "order_index": 100
    },
    {
      "id": 999,
      "name": "อื่นๆ (Other)",
      "pet_type_id": "DOG",
      "active": true,
      "order_index": 999
    }
  ]
  ```

  For CAT (pet_type_id: "CAT"):

  ```json
  [
    {
      "id": 201,
      "name": "หมวยไทย",
      "pet_type_id": "CAT",
      "active": true,
      "order_index": 1
    },
    {
      "id": 202,
      "name": "สยามเหลือบขาว",
      "pet_type_id": "CAT",
      "active": true,
      "order_index": 2
    },
    {
      "id": 203,
      "name": "เพอร์เซีย",
      "pet_type_id": "CAT",
      "active": true,
      "order_index": 3
    },
    {
      "id": 204,
      "name": "ปอนด์",
      "pet_type_id": "CAT",
      "active": true,
      "order_index": 4
    },
    {
      "id": 300,
      "name": "ผสม (Mixed)",
      "pet_type_id": "CAT",
      "active": true,
      "order_index": 100
    },
    {
      "id": 999,
      "name": "อื่นๆ (Other)",
      "pet_type_id": "CAT",
      "active": true,
      "order_index": 999
    }
  ]
  ```

- **Weight Input:**
  - Accepts decimal (e.g., 4.5 kg)
  - Shows helper text: "สำหรับประมาณขนาด (S/M/L)"
  - Used in Step 3 for size estimation via `/api/config/pet-sizes?petTypeId=X`

---

## Step 3/4: เลือกบริการ (Select Service)

### Layout

```
┌────────────────────────────────────────────────────────┐
│ 🚀 Quick Transaction  [Progress: ████████████░░] 3/4   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  เลือกบริการ                                          │
│  ──────────────────────────────────────────────────── │
│                                                        │
│  ลูกค้า: สมชาย วงศ์มี | สัตว์: 🐕 ขุณ (18 kg)    │ ← Context
│                                                        │
│  📌 Grooming - บริการตัดสัตว์                         │
│  ┌──────────────────────────────────────────────────┐│
│  │ ◉ ตัดสัตว์ (Standard Cut)          ฿500       ││ ← Estimated Size: M
│  │     พบเบาะ 4.0-6.0 kg                           ││
│  │                                                  ││
│  │ ○ ตัดสัตว์ (Full Detail)          ฿750       ││
│  │     พบเบาะ 4.0-6.0 kg                           ││
│  │                                                  ││
│  │ ○ บาธ + ตัดสัตว์                  ฿900       ││
│  │     พบเบาะ 4.0-6.0 kg                           ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│  💉 Health Check                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ ☑ Health Checkup                 ฿300         ││
│  │                                                  ││
│  │ ☐ Vaccination                    ฿200         ││
│  │                                                  ││
│  │ ☐ Parasite Treatment             ฿150         ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│  🏨 Hotel Boarding                                    │
│  ┌──────────────────────────────────────────────────┐│
│  │ ○ Not Available for this size                   ││ ← Disabled service
│  │     Minimum weight: 20 kg                        ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│  ⓘ ขนาด: S (เล็ก) | M (กลาง) | L (ใหญ่)          │
│                                                        │
│                             [< ย้อนกลับ]  [ถัดไป >]  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### UI Details

- **Service Categories:**
  - Group by category (Grooming, Health Check, Hotel, etc.)
  - Each category has its own section with header icon
- **Service Selection (Fetched from API):**

  Fetch services on Step 3 entry:

  ```typescript
  const response = await fetch("/api/services?active=true");
  const { data: services } = await response.json();
  // services include full pricing info for all pet types & sizes
  ```

  - Some services: Radio buttons (select 1 per category)
  - Some services: Checkboxes (select multiple)
  - Show estimated size based on pet weight (from `/api/config/pet-sizes`)
  - Show price per service (from `service_prices` in response)

- **Service Card Layout:**
  - Service name + price on first line
  - Size info (if applicable): "พบเบาะ 4.0-6.0 kg" (Size M)
  - Disabled services show reason: "Not available for this size"

  **Example: Service with Prices**

  ```json
  {
    "id": 1,
    "name": "ตัดสัตว์",
    "description": "บริการตัดเสน่ห์สัตว์เลี้ยง",
    "active": true,
    "service_prices": [
      { "id": 101, "pet_type_id": "DOG", "size_id": "S", "price": 500 },
      { "id": 102, "pet_type_id": "DOG", "size_id": "M", "price": 600 },
      { "id": 103, "pet_type_id": "DOG", "size_id": "L", "price": 700 },
      { "id": 104, "pet_type_id": "CAT", "size_id": "S", "price": 400 },
      { "id": 105, "pet_type_id": "CAT", "size_id": "M", "price": 500 }
    ]
  }
  ```

- **Context Bar:**
  - Show customer name
  - Show pet name + type + weight
  - Changes when editing previous step

- **Price Logic (Calculated from API Data):**

  For each selected pet:

  ```typescript
  // 1. Get pet type (from pet data)
  const petTypeId = pet.type; // "DOG" or "CAT"

  // 2. Estimate size from weight
  const sizeId = estimateSizeFromWeight(pet.weight, petTypeId);
  // Uses /api/config/pet-sizes response to find matching size

  // 3. Find price for this service + pet type + size
  const price = service.service_prices.find(
    (p) => p.pet_type_id === petTypeId && p.size_id === sizeId,
  )?.price;

  // 4. If service not available for this size → disable & show reason
  if (!price) {
    // Check why: show "Not available for pet type" or "Not available for size"
    // Display min/max weight requirements if applicable
  }
  ```

---

## Step 4/4: ตรวจสอบและสร้าง (Review & Confirm)

### Layout

```
┌────────────────────────────────────────────────────────┐
│ 🚀 Quick Transaction  [Progress: ████████████████] 4/4  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ตรวจสอบข้อมูล                                       │
│  ──────────────────────────────────────────────────── │
│                                                        │
│  👤 ลูกค้า                                             │
│  ┌──────────────────────────────────────────────────┐│
│  │ ชื่อ: สมชาย วงศ์มี                              ││
│  │ เบอร์: 081-2345678                               ││
│  │                                    [แก้ไข]      ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│  🐕 สัตว์เลี้ยง                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │ 1. ขุณ (🐕 Dog, ไทยหลังอาน, 18 kg)            ││
│  │                                    [แก้ไข]      ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│  🛒 บริการที่เลือก                                    │
│  ┌──────────────────────────────────────────────────┐│
│  │ ขุณ (Dog, M)                                    ││
│  │  ├─ ตัดสัตว์ (Standard Cut)        ฿500       ││
│  │  ├─ Health Checkup                 ฿300       ││
│  │  └─ Vaccination                    ฿200       ││
│  │                                                  ││
│  │ Subtotal                             ฿1,000     ││
│  │                                   [แก้ไข]      ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│  💰 สรุปยอด                                           │
│  ┌──────────────────────────────────────────────────┐│
│  │ Subtotal                           ฿1,000       ││
│  │ Discount (if any)                  -           ││
│  │ ─────────────────────────────────────────       ││
│  │ Total                              ฿1,000       ││
│  │                                                  ││
│  │ [💰 Pay Now]  [Add to Cart]       ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│                             [< ย้อนกลับ]              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### UI Details

- **Customer Section:**
  - Show all entered info
  - [แก้ไข] button → go back to Step 1
  - Display phone formatted: "081-2345678"

- **Pet Section:**
  - List all added pets
  - Show: Name, Type (icon), Breed, Weight
  - [แก้ไข] button → go back to Step 2

- **Services Section:**
  - Grouped by pet
  - Show: Pet name, type, size
  - List all selected services with prices
  - Subtotal per pet
  - [แก้ไข] button → go back to Step 3

- **Total Section:**
  - Show Subtotal
  - Show Discount (if applied)
  - Show Final Total
  - Two action buttons:
    - [💰 Pay Now]: Create customer/pets + Start payment
    - [Add to Cart]: Create customer/pets + Add to cart, close modal

- **Edit Buttons:**
  - Each section can be edited without losing other data
  - Goes back to corresponding step
  - Pre-fills all data

---

## Modal Chrome (All Steps)

### Header

```
┌──────────────────────────────────────────────────────┐
│ [🚀 Quick Transaction]  [====░░░░░░]  Step X/4  [×] │
├──────────────────────────────────────────────────────┤
│ Step Title: ชื่อของ Step นี้                          │
└──────────────────────────────────────────────────────┘
```

### Progress Bar

- Visual progress indicator
- Show current step number: "1/4", "2/4", "3/4", "4/4"
- Can be visual bar or step dots

### Footer

```
├──────────────────────────────────────────────────────┤
│                                                      │
│            [< ย้อนกลับ]           [ถัดไป >]        │
│            [< Back]   [Default/Cancel]  [Next >]    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Button States

| Step | Left Button | Right Button                            | Behavior                           |
| ---- | ----------- | --------------------------------------- | ---------------------------------- |
| 1    | ยกเลิก      | ถัดไป (disabled until name filled)      | Next enabled when name has value   |
| 2    | < ย้อนกลับ  | ถัดไป (disabled until pet added)        | Next enabled when 1+ pet added     |
| 3    | < ย้อนกลับ  | ถัดไป (disabled until service selected) | Next enabled when service selected |
| 4    | < ย้อนกลับ  | 💰 Pay Now / Add to Cart                | Both always enabled                |

---

## Responsive Design (Mobile)

```
┌──────────────────────────────┐
│ 🚀 Quick Transaction   [×]  │
├──────────────────────────────┤
│                              │
│ [====░░░░░] Step 1/4        │
│                              │
│ ข้อมูลลูกค้า                 │
│ ────────────────────────    │
│                              │
│ ชื่อ *                       │
│ [...........................]│
│                              │
│ เบอร์ *                      │
│ [...........................]│
│                              │
│ [ยกเลิก] [ถัดไป >]          │
│                              │
└──────────────────────────────┘
```

### Mobile Adjustments:

- Stack all sections vertically
- Full-width inputs and buttons
- Larger touch targets (min 44px)
- Progress indicator shows as dots or text "Step 1/4"
- Modal takes up ~90% of viewport
- Scrollable content area

---

## 🏗️ Architecture

### New Components

```
components/pos/
├── fast-pos-modal.tsx           # Main modal wrapper
├── fast-pos-step-1-customer.tsx  # Customer info step
├── fast-pos-step-2-pet.tsx       # Pet info step
├── fast-pos-step-3-service.tsx   # Service selection step
├── fast-pos-step-4-review.tsx    # Review & confirm step
└── fast-pos-context.ts           # Shared state (form data, current step)
```

### State Management

```typescript
// Fast POS State
interface FastPOSState {
  currentStep: 1 | 2 | 3 | 4;
  customer: {
    name: string;
    phone: string;
  };
  pets: Array<{
    name: string;
    type: "DOG" | "CAT";
    breed: string;
    weight?: number;
  }>;
  selectedServices: Array<{
    petIndex: number;
    serviceId: number;
    sizeId?: string;
    price: number;
  }>;
  isLoading: boolean;
  error?: string;
}
```

### Store Integration

Use existing Zustand stores:

- `useCustomerStore` → create customer
- `usePOSStore` → add to cart
- `useServiceStore` → get services
- `useServiceConfigStore` → get sizes for weight

---

## 🎨 UI/UX Details

### Modal Header

```
[🚀 Quick Transaction] [Customer] [Pet] [Service] [Review]
────────────────────────────────────
Current: Step 1/4 - Customer Information
────────────────────────────────────
[Close] ... [Back] [Next >]
```

### Step Navigation

- **Previous button:** Enable from step 2 onwards
- **Next button:** Enable when current step is valid
- **Close button:** Always available (ask for confirmation if data entered)
- **Step indicators:** Visual progress (dots/numbers)

### Pet Type Icons

- 🐕 Dog
- 🐈 Cat

### Price Display

- Each service shows: `Service Name - ฿XXX`
- When multiple pets: `Pet 1 (Service) - ฿XXX`, `Pet 2 (Service) - ฿XXX`
- Total at bottom

---

## 🔧 Implementation Details

### Validation Rules

**Step 1 - Customer:**

- ✓ Name: required, min 1 char
- ✓ Phone: required OR optional (สำหรับลูกค้าไม่ระบุเบอร์)
- ✓ Auto-detect duplicate → "ลูกค้านี้มีอยู่แล้ว ใช้ลูกค้าเดิมหรือสร้างใหม่?"

**Step 2 - Pet:**

- ✓ Name: required
- ✓ Type: required
- ✓ Breed: required
- ✓ Weight: optional (use for size estimation)

**Step 3 - Service:**

- ✓ At least 1 service must be selected
- ✓ If multiple pets: each pet must have service selected
- ✓ Size auto-estimate based on weight

**Step 4 - Review:**

- ✓ No validation needed (just review)

### 🔌 API Integration

#### 1️⃣ Step 2: Load Pet Types & Breeds on Mount

**GET /api/config/pet-types**

```typescript
// Fetch all pet types (Dog, Cat, etc.)
const response = await fetch("/api/config/pet-types");
const { data: petTypes } = await response.json();
// Response: [{ id: "DOG", name: "สุนัข", icon: "🐕", order: 1, active: true }, ...]
```

**GET /api/breeds?petTypeId={petTypeId}**

```typescript
// Fetch breeds filtered by pet type when user selects a type
const petTypeId = "DOG"; // or "CAT"
const response = await fetch(`/api/breeds?petTypeId=${petTypeId}&active=true`);
const breeds = await response.json();
// Response: [{ id: 1, pet_type_id: "DOG", name: "ไทยหลังอาน", active: true, order_index: 1 }, ...]
```

#### 2️⃣ Step 3: Load Services & Sizes on Step 3 Display

**GET /api/services?active=true**

```typescript
// Fetch all active services with prices
const response = await fetch("/api/services?active=true");
const { data: services } = await response.json();
// Response: [
//   {
//     id: 1,
//     name: "ตัดสัตว์",
//     description: "...",
//     active: true,
//     service_prices: [
//       { id: 1, pet_type_id: "DOG", size_id: "S", price: 500 },
//       { id: 2, pet_type_id: "DOG", size_id: "M", price: 600 },
//     ]
//   },
//   ...
// ]
```

**GET /api/config/pet-sizes?petTypeId={petTypeId}**

```typescript
// Fetch sizes for pet type (used to estimate size from weight)
const petTypeId = "DOG";
const response = await fetch(`/api/config/pet-sizes?petTypeId=${petTypeId}`);
const { data: sizes } = await response.json();
// Response: [
//   { id: "S", pet_type_id: "DOG", name: "เล็ก", min_weight: 0, max_weight: 4, order_index: 1, active: true },
//   { id: "M", pet_type_id: "DOG", name: "กลาง", min_weight: 4, max_weight: 8, order_index: 2, active: true },
//   { id: "L", pet_type_id: "DOG", name: "ใหญ่", min_weight: 8, max_weight: null, order_index: 3, active: true },
// ]
```

#### 3️⃣ Step 4: Create Customer & Pets, Add to Cart

**POST /api/customers**

```typescript
// Create new customer
const customerResponse = await fetch("/api/customers", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "สมชาย วงศ์มี",
    phone: "0812345678",
  }),
});
const { data: customer } = await customerResponse.json();
// Response: { id: 123, name: "สมชาย วงศ์มี", phone: "0812345678", pets: [], ... }
```

**POST /api/pets** (for each pet)

```typescript
// Create pet for the customer
for (const petData of petList) {
  const petResponse = await fetch("/api/pets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id: customer.id,
      name: "ขุณ",
      type: "DOG", // or "CAT"
      breed: "ไทยหลังอาน",
      breed_2: null,
      is_mixed_breed: false,
      weight: 18,
      note: "",
    }),
  });
  const { data: pet } = await petResponse.json();
  // Response: { id: 456, customer_id: 123, name: "ขุณ", type: "DOG", ... }
}
```

**Add to Cart using usePOSStore**

```typescript
// After creating customer and pets, add services to cart
import { usePOSStore } from "@/lib/store";

// Set selected customer (optional, for reference)
usePOSStore.getState().setSelectedCustomer(customer.id);

// Add each service to cart
for (const service of selectedServices) {
  usePOSStore.getState().addToCart({
    serviceId: service.serviceId,
    serviceName: service.serviceName,
    petId: service.petId,
    petName: service.petName,
    petType: service.petType,
    sizeId: service.sizeId,
    price: service.price,
  });
}

// Show success toast
toast.success(`${customer.name} เพิ่มลงในรถเข็นแล้ว`);

// Close modal
closeModal();
```

### API Call Sequence

```
┌─────────────────────────────────────────────────────────┐
│ Modal Open                                              │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ Step 1: Customer Info (No API calls)                    │
│ - Store name & phone in local state                     │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: Pet Info (Conditional API calls)                │
│ 1. GET /api/config/pet-types (when showing pet type)   │
│ 2. GET /api/breeds?petTypeId=X (when type selected)    │
│ - Store pet data in local state                         │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Select Service                                  │
│ 1. GET /api/services?active=true (on step enter)       │
│ 2. GET /api/config/pet-sizes?petTypeId=X (per pet)    │
│ - Filter services by pet type(s)                        │
│ - Show prices for selected sizes                        │
│ - Store service selections in local state               │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Review & Confirm                                │
│ 1. POST /api/customers (create customer)               │
│ 2. POST /api/pets (create each pet)                    │
│ 3. usePOSStore.addToCart (add services to cart)        │
│ 4. Show success toast & close modal                     │
└─────────────────────────────────────────────────────────┘
```

### Data Caching Strategy

```
// Use React Context or local state for:
- Pet types (fetch once on component mount, cache for 5 mins)
- Pet sizes (fetch per pet type, cache for 5 mins)
- Services (fetch once on step 3 enter, cache until modal closes)
- Breeds (fetch per pet type selection, cache for session)

// Why caching?
- Reduce API calls
- Improve UX responsiveness
- Already done in existing POSContent via fetchAllPOSData
```

### 📌 API Quick Reference

| API Endpoint                            | Method | When               | Purpose                             | Response                           | Caching       |
| --------------------------------------- | ------ | ------------------ | ----------------------------------- | ---------------------------------- | ------------- |
| `/api/config/pet-types`                 | GET    | Step 2 mount       | Get all pet types (Dog, Cat)        | Array of pet types with icons      | 5 min         |
| `/api/breeds?petTypeId={X}&active=true` | GET    | Pet type selected  | Get breeds for selected type        | Array of breeds                    | Session       |
| `/api/config/pet-sizes?petTypeId={X}`   | GET    | Service step enter | Get sizes for weight estimation     | Array of sizes with min/max weight | 5 min         |
| `/api/services?active=true`             | GET    | Step 3 enter       | Get all active services with prices | Array of services + service_prices | Modal session |
| `/api/customers` (search)               | GET    | Step 1 (optional)  | Check if customer exists            | Customer data if found             | Real-time     |
| `/api/customers`                        | POST   | Step 4 confirm     | Create new customer                 | New customer object                | -             |
| `/api/pets`                             | POST   | Step 4 confirm     | Create pets for customer            | New pet object                     | -             |

---

## 🚀 Usage & Entry Points

### 1️⃣ Main Entry: From Dashboard

**Location:** Dashboard page header (next to page title)

**Button Design:**

```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                                [⚡ สร้างรายการ POS]
│ ภาพรวมการดำเนินงานของร้าน                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Stats Cards...]                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// In app/(dashboard)/page.tsx
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">ภาพรวมการดำเนินงานของร้าน</p>
        </div>

        {/* Fast POS Quick Button */}
        <Link href="/pos?quickMode=true">
          <Button
            size="lg"
            className="gap-2 bg-primary hover:bg-primary/90"
            variant="default"
          >
            <Zap className="h-5 w-5" />
            <span className="hidden sm:inline">⚡ สร้างรายการ POS</span>
            <span className="sm:hidden">สร้าง POS</span>
          </Button>
        </Link>
      </div>

      {/* Rest of dashboard content */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* ... other content ... */}
    </div>
  );
}
```

**Button Naming Options:**
| ชื่อ | ความหมาย | ใช้งาน |
|-----|--------|------|
| **⚡ สร้างรายการ POS** | Lightning bolt + create transaction | Recommended (prominent, fast vibe) |
| **🚀 Quick Transaction** | Rocket + quick transaction | Alternative (playful) |
| **💨 ทำรายการด่วน** | Wind + fast transaction | Alternative (Thai, simple) |
| **🏃 New Order** | Runner + new order | Alternative (dynamic) |

**Recommended:** `⚡ สร้างรายการ POS` (Lightning icon = fast, "สร้างรายการ POS" = clear action)

**Mobile Responsive:**

- Desktop: "⚡ สร้างรายการ POS" (full text)
- Tablet: "⚡ สร้างรายการ POS" (full text)
- Mobile: "⚡ สร้าง POS" or "⚡ POS" (abbreviated to save space)

---

### 2️⃣ Secondary Entry: From POS Page

**Location:** POSCustomerSelector card (when no customer selected)

**Button Design:**

```
┌────────────────────────────────────────────────────────┐
│ 👤 ข้อมูลลูกค้า                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [Tab] ลูกค้าเดิม | ⚡ สร้างลูกค้าใหม่               │
│                                                        │
│ ┌────────────────────────────────────────────────────┐│
│ │ 🔍 ค้นหาลูกค้า (ชื่อ, เบอร์โทร)                  ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ [รายชื่อลูกค้าแนะนำ...]                             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
// In components/pos/pos-customer-selector.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function POSCustomerSelector() {
  const [openFastPOSModal, setOpenFastPOSModal] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            ข้อมูลลูกค้า
          </span>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setOpenFastPOSModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">สร้างลูกค้าใหม่</span>
            <span className="sm:hidden">เพิ่ม</span>
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">ลูกค้าเดิม</TabsTrigger>
            <TabsTrigger value="new">⚡ สร้างใหม่</TabsTrigger>
          </TabsList>

          <TabsContent value="existing">
            {/* Existing customer search and list */}
          </TabsContent>

          <TabsContent value="new">
            {/* Fast POS modal triggers here */}
            <FastPOSModal
              open={openFastPOSModal}
              onOpenChange={setOpenFastPOSModal}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

**Alternative: Tab-based Entry**

```
[ลูกค้าเดิม] | [⚡ สร้างลูกค้าใหม่]
     │                │
     └─ Search      └─ FastPOS Modal
```

---

### 3️⃣ Entry Point Summary

| Location              | Button Text        | Icon      | Trigger                           | Best For                       |
| --------------------- | ------------------ | --------- | --------------------------------- | ------------------------------ |
| **Dashboard**         | ⚡ สร้างรายการ POS | Zap       | Navigate to `/pos?quickMode=true` | New users, quick access        |
| **POS Page (Header)** | ⚡ สร้างลูกค้าใหม่ | Plus      | Open FastPOS Modal                | When on POS, know new customer |
| **POS Page (Tab)**    | ⚡ สร้างใหม่       | Lightning | Open FastPOS Modal                | Alternative if no customer     |

---

### Usage Flow

**Flow 1: From Dashboard (Fastest)**

```
Dashboard [⚡ สร้างรายการ POS]
    │
    ▼
Navigate to POS with ?quickMode=true
    │
    ▼
FastPOS Modal opens automatically
    │
    ▼
Fill 4 steps → Confirm → Cart updated → Proceed to payment
```

**Flow 2: From POS Page (If already on POS)**

```
POS Page [Click ⚡ button in POSCustomerSelector]
    │
    ▼
FastPOS Modal opens
    │
    ▼
Fill 4 steps → Confirm → Cart updated → Continue
```

---

### Alternative: Button Location

- **Option A:** In POSCustomerSelector card (when no customer selected) ✅ Recommended
- **Option B:** Floating button above customer selector
- **Option C:** In the "Add to Cart" flow
- **Option D:** Dashboard header button ✅ Recommended (new)

---

## 📊 Benefits

| Metric                    | Before                     | After                           |
| ------------------------- | -------------------------- | ------------------------------- |
| **Steps**                 | 8+                         | 4                               |
| **Page Transitions**      | 3 (Customers → Pets → POS) | 0 (All in 1 modal)              |
| **Keyboard Input Fields** | ~6                         | ~4                              |
| **Time per Transaction**  | 2-3 min                    | 30-45 sec                       |
| **Error Rate**            | Higher (multiple forms)    | Lower (validation at each step) |

---

## 🔄 Error Handling

- **Customer exists:** Auto-suggest existing customer
- **Invalid pet weight:** Show warning, allow to skip size selection
- **Service unavailable:** Show as disabled, explain why
- **Network error:** Show retry button, don't clear form data
- **Duplicate submission:** Show loading state, disable confirm button

---

## 📝 Phase 2 Enhancements (Future)

1. **Templates/Presets:** Save favorite service combinations
2. **Quick Repeat:** "Same service as last time" button for returning customers
3. **Barcode Scanning:** Add pet/customer lookup via barcode
4. **Suggested Services:** AI-based suggestions based on pet type & weight
5. **Quick Notes:** Add service notes/special requests field
6. **Deposit Collection:** Option to collect deposit during transaction
7. **Payment Integration:** Complete payment flow within modal

---

## 🛠️ Technical Notes

### Component Architecture

- Use React Context for step state (avoid prop drilling)
- FastPOSModal should be mountable from multiple locations (Dashboard, POS page)
- Support URL parameter `?quickMode=true` to auto-open modal on page load

### Form & Validation

- Debounce phone number validation input (300ms)
- Cache service data (already done in POSContent via fetchAllPOSData)
- Handle modal dismissal gracefully (confirm unsaved changes)
- Client-side validation before API submission

### UI/UX

- Mobile-first design (steps stack vertically)
- Keyboard navigation: Tab, Enter, Escape
- Responsive button text (full/abbreviated based on screen size)
- Use consistent icon: Zap (⚡) for "fast" action indicator
- Ensure button is always visible and accessible from current view

### Dashboard Button Styling

```tsx
// Button should have:
// - Primary color (brand color) for high visibility
// - Icon on left (Zap for "fast" concept)
// - Size "lg" for easy clicking
// - Responsive text hiding on mobile
// - Clear hierarchy vs other dashboard buttons

// Desktop: "⚡ สร้างรายการ POS" (primary color, lg size)
// Mobile: "⚡ สร้าง POS" or icon only (if too small)
```

### API Caching & Performance

- Cache pet types (5 min TTL)
- Cache pet sizes per type (5 min TTL)
- Cache services (modal session TTL)
- Cache breeds per pet type (session TTL)
- Don't cache customer search results (real-time)

---

## 📋 Implementation Checklist

### Core Components

- [ ] Create FastPOSContext & Provider
- [ ] Build Step 1 Component (Customer)
- [ ] Build Step 2 Component (Pet)
- [ ] Build Step 3 Component (Service)
- [ ] Build Step 4 Component (Review)
- [ ] Create Main Modal Wrapper

### Feature Integration

- [ ] Add Dashboard button (app/(dashboard)/page.tsx)
  - [ ] Button styling with Zap icon
  - [ ] Mobile responsive text (full/abbreviated)
  - [ ] Navigation to /pos?quickMode=true
- [ ] Add POS page button (POSCustomerSelector)
  - [ ] Tab-based UI (Existing | Create New)
  - [ ] Modal trigger on tab change
- [ ] Auto-open FastPOS modal when ?quickMode=true parameter detected

### Functionality

- [ ] Add validation logic for all steps
- [ ] Handle duplicate customer detection
- [ ] Implement pet type/breed/size APIs
- [ ] Implement service pricing calculation
- [ ] Test with existing customer data
- [ ] Add loading/error states for API calls
- [ ] Handle network errors gracefully

### UX & Polish

- [ ] Mobile responsiveness for all screens
- [ ] Toast notifications (success/error)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Proper focus management
- [ ] Loading indicators during API calls
- [ ] Unsaved changes confirmation on modal close

### Documentation

- [ ] Code comments in components
- [ ] API integration guide
- [ ] Troubleshooting guide
- [ ] User manual / training docs
