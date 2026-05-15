# Fast POS - Clarifications & Updates

## ✅ Updated Requirements

### Step 1/4: ข้อมูลลูกค้า (Customer Information)

**ชื่อลูกค้า (Name Field):**

- Type: Searchable autocomplete dropdown (required)
- Display format: `[Customer Name] [Phone] | [Pet names]`
- Data source: GET `/api/customers?search={query}` (real-time search)
- Option: `+ สร้างลูกค้าใหม่` at bottom
- Behavior on selection:
  - **Select existing customer:** Pre-fill phone + jump to Step 2 (show existing pets)
  - **Select "สร้างลูกค้าใหม่":** Clear phone field, continue Step 1

**เบอร์โทรศัพท์ (Phone Field):**

- Type: `tel` (OPTIONAL - changes from required to optional)
- Max length: 10 digits
- Auto-format: Insert dash "081-2345678"
- Helper text: "ไม่บังคับ (ถ้าไม่กรอก จะใช้ 0000000000)"
- Validation logic:
  - Empty → Allow (will auto-fill as "0000000000" when clicking Next)
  - 1-9 digits → Show as typing (no validation)
  - **10 digits → Trigger phone detection (GET `/api/customers?phone={phone}`)**
  - **"0000000000" → Skip detection (don't call API)**
- If found: Show customer info card
- If not found: Continue (allow new customer)

**Detection Alert (Phone-based):**

```
┌─────────────────────────────────┐
│ ✓ พบข้อมูลลูกค้า              │
│                                 │
│ ชื่อ: สมชาย วงศ์มี            │
│ เบอร์: 081-2345678             │
│ สัตว์: 🐕 ขุณ, 🐈 เมียว       │
│                                 │
│ [ใช้ลูกค้าเดิม]  [สร้างใหม่]  │
└─────────────────────────────────┘
```

---

### Step 2/4: ข้อมูลสัตว์เลี้ยง (Pet Information)

**Case 1: ลูกค้าใหม่** (Same as original design)

- Show form to add new pets
- Can add multiple pets with [+ เพิ่มสัตว์เลี้ยง]
- [✓ เสร็จแล้ว] to finish

**Case 2: ลูกค้าเดิม** (NEW - if existing customer selected in Step 1)

- Show existing pets list with checkboxes:
  - Format: `☑ 🐕 ขุณ (Dog, ไทยหลังอาน, 18 kg)`
  - Each pet has [แก้ไขน้ำหนัก] button (pop-up to edit weight only)
  - Multi-select allowed (can choose multiple pets for same service)
- Allow adding new pet using form below
- Proceed to Step 3 only if ≥1 pet selected

---

### Step 3/4: เลือกบริการ (Select Service) - UPDATED

**Key Change: Service selection is per-pet**

- Show selected pet as context (name, type, weight)
- Fetch services filtered by pet type + weight
- Show main services (filter by weight) + optional/special services
- Service cards layout: icon + name + price + size info
- After selecting services for current pet:
  - If only 1 pet → [ถัดไป] go to Step 4 (review & confirm)
  - If multiple pets → Show [ถัดไป] or continue with next pet
    - Allow loop through each pet to select their services
    - Or show all pets in tabs/accordion for service selection

---

### Step 4/4: สรุปบิล (Summary & Confirm) - UPDATED

**Button changes:**

- Remove: "💰 Pay Now" (for now)
- Keep: "Add to Cart" only
- Button text: "บันทึกรายการ" or "[+ เพิ่มรถเข็น]"
- Payment: Fix to QR code only (not "Pay Now" yet)

**Data saving:**

- POST `/api/customers` (create customer)
- POST `/api/pets` (create each pet)
- POST `/api/sales` (create sale record)
- usePOSStore.addToCart (add items to POS cart)
- Show success toast + close modal

---

## 🔄 API Changes Needed

### Phone Detection API

```typescript
// GET /api/customers?phone={phone}
// Only call if:
// - Phone length === 10 digits
// - Phone !== "0000000000"

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "name": "สมชาย วงศ์มี",
    "phone": "0812345678",
    "pets": [
      { "id": 1, "name": "ขุณ", "type": "DOG", "breed": "ไทยหลังอาน", "weight": 18 },
      { "id": 2, "name": "เมียว", "type": "CAT", "breed": "เพอร์เซีย", "weight": 5 }
    ]
  }
  // or empty if not found
}
```

### Customer Search API (Autocomplete)

```typescript
// GET /api/customers?search={query}&limit=5

Response:
{
  "data": [
    {
      "id": 123,
      "name": "สมชาย วงศ์มี",
      "phone": "0812345678",
      "pets": ["ขุณ", "เมียว"],
      "lastTransactionDate": "2024-05-10"  // For sorting
    }
  ]
}
```

---

## 📊 State Management Changes

### FastPOSState Update

```typescript
interface FastPOSState {
  currentStep: 1 | 2 | 3 | 4;
  customer: {
    id?: number; // ← Added (for existing customer)
    name: string;
    phone: string; // ← Auto "0000000000" if empty
  };
  pets: Array<{
    id?: number; // ← Added (for existing pet)
    name: string;
    type: "DOG" | "CAT";
    breed: string;
    weight?: number;
    selected: boolean; // ← Added (for multi-select in Step 2)
  }>;
  selectedServices: Array<{
    petIndex: number;
    petId?: number;
    serviceId: number;
    sizeid?: string;
    price: number;
  }>;
  isLoading: boolean;
  error?: string;
}
```

---

## 🎯 Summary of Changes

| Component                  | Change                                                   |
| -------------------------- | -------------------------------------------------------- |
| **Step 1 Name**            | Text input → Searchable dropdown autocomplete            |
| **Step 1 Phone**           | Required → Optional (auto "0000000000" if empty)         |
| **Step 1 Phone Detection** | By name → By phone (only if 10 digits, not "0000000000") |
| **Step 2**                 | Add Case 2 for existing customer (pet multi-select)      |
| **Step 2 Edit**            | Add [แก้ไขน้ำหนัก] button per pet                        |
| **Step 3**                 | Service selection is per-pet loop (if multiple pets)     |
| **Step 4 Buttons**         | Remove "Pay Now", keep "บันทึก/Add to Cart" only         |
| **Step 4 Payment**         | Fix to QR code, no direct payment integration yet        |

---

## 📝 Implementation Priority

1. **Phase 1 (Core):**
   - Step 1: Autocomplete dropdown + phone detection by phone
   - Step 2: Add existing customer pet selection UI
   - Step 3: Per-pet service selection loop
   - Step 4: Update button labels + payment method

2. **Phase 2 (Polish):**
   - Weight edit pop-up per pet
   - Service suggestion based on pet history
   - Analytics logging per step
