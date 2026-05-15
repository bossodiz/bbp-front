# 🚀 Fast POS Feature - Master Reference

**Status:** Specification complete, implementation pending.

---

## 📚 Quick Navigation

Choose which document to read based on your role:

### **Option 1: For Managers/Stakeholders** 
📄 **[Fast POS - Changes Summary](FAST_POS_CHANGES_SUMMARY.md)**
- **What?** Overview of all updates + what changed from original design
- **Length:** ~2 min read
- **Contains:** 
  - ✅ Before/After comparison
  - 📊 API endpoints summary
  - 🎯 Next steps for development

### **Option 2: For Developers (Technical Details)**
📄 **[Fast POS - Clarifications & Updates](FAST_POS_CLARIFICATIONS.md)**
- **What?** Detailed specifications of requirements & implementation priority
- **Length:** ~5 min read
- **Contains:**
  - ✅ Step-by-step updated requirements
  - 🔌 API specs (phone detection, autocomplete)
  - 💾 State management updates
  - 📋 Implementation priority

### **Option 3: For Complete Reference (Full Design)**
📄 **[Fast POS - Full Design Document](fast_pos.md)**
- **What?** Complete design with mockups, architecture, all details
- **Length:** ~15 min read (or use as reference)
- **Contains:**
  - 🎨 Full UI mockups for all 4 steps
  - 🏗️ Component architecture
  - 🔌 Complete API integration guide
  - ✅ Implementation checklist

---

## ⚡ Quick Summary

### What Changed from Original Design?

| Feature | Old | New |
|---------|-----|-----|
| **Customer Name** | Text input | Searchable dropdown |
| **Phone Field** | Required | Optional (auto-fill 0000000000) |
| **Duplicate Check** | By name | By phone (10 digits only) |
| **Pet Selection** | Single pet | Multi-select (for existing customers) |
| **Service Selection** | Global for all | Per-pet loop |
| **Weight Editing** | Not editable | [แก้ไขน้ำหนัก] button per pet |
| **Payment Button** | Pay Now + Add to Cart | บันทึก only (QR code) |

---

## 🎯 Current Implementation Status

### ❌ **NOT STARTED** - All 0/100%

| Category | Status | Items |
|----------|--------|-------|
| **Core Components** | 0/6 | FastPOSContext, Step 1-5 components, Modal wrapper |
| **Feature Integration** | 0/3 | Dashboard button, POS page button, URL auto-open |
| **Functionality** | 0/7 | Validation, duplicate detection, APIs, pricing |
| **UX & Polish** | 0/6 | Mobile, toasts, keyboard nav, focus, loading, confirmation |
| **Documentation** | 1/4 | ✅ Spec docs, ❌ Code comments, integration guide, troubleshooting |

**Next Step:** Start with Phase 1 (Core) components

---

## 📋 Phase 1 Implementation Checklist (Core)

### Step 1: Customer Information
- [ ] Create autocomplete dropdown for customer name
- [ ] Implement GET `/api/customers?search={q}` integration
- [ ] Add phone field (optional, auto-format, auto-fill 0000000000)
- [ ] Implement phone detection: GET `/api/customers?phone={phone}`
- [ ] Show customer detection card (only if 10 digits & != 0000000000)
- [ ] Handle "สร้างลูกค้าใหม่" option

### Step 2: Pet Information
- [ ] Add Case 2 UI: Existing customer pet multi-select (checkboxes)
- [ ] Add [แก้ไขน้ำหนัก] button per pet (popup to edit weight only)
- [ ] Keep Case 1: New customer pet form (existing design)
- [ ] Validation: ≥1 pet must be selected before Next

### Step 3: Service Selection (Per-Pet Loop)
- [ ] Update UI to show current pet context
- [ ] Implement per-pet service selection loop
- [ ] If multiple pets: Show pet counter `[Pet 1/2]` or tabs/accordion
- [ ] Filter services by pet type + weight
- [ ] Show disabled services with reason

### Step 4: Review & Confirm
- [ ] Change button text: "บันทึก" or "Add to Cart" (remove "Pay Now")
- [ ] Fix payment method to QR code only
- [ ] Update API calls:
  - POST `/api/customers` (create customer)
  - POST `/api/pets` (create each pet)
  - POST `/api/sales` (create sale record) ← **NEW**
  - usePOSStore.addToCart (add items to cart)

### Entry Points
- [ ] Add Dashboard button: "⚡ สร้างรายการ POS"
- [ ] Add POS page button: Tab-based UI for modal
- [ ] Auto-open modal if `?quickMode=true` URL parameter

---

## 🔌 API Endpoints to Implement

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/customers?search={q}` | GET | ❓ Check | Autocomplete dropdown |
| `/api/customers?phone={p}` | GET | ❓ Check | Phone detection (10 digits only) |
| `/api/customers?phone=0000000000` | GET | ❌ SKIP | Don't call this (skip detection) |
| `/api/config/pet-types` | GET | ✅ Exists | Get pet types (Dog, Cat) |
| `/api/breeds?petTypeId={id}` | GET | ✅ Exists | Get breeds per type |
| `/api/config/pet-sizes?petTypeId={id}` | GET | ✅ Exists | Get sizes for weight |
| `/api/services?active=true` | GET | ✅ Exists | Get services + prices |
| `/api/customers` | POST | ✅ Exists | Create customer |
| `/api/pets` | POST | ✅ Exists | Create pet |
| `/api/sales` | POST | ❌ NEW | Create sale record |

---

## 📂 Files Overview

| File | Purpose | Read Time |
|------|---------|-----------|
| **FAST_POS_MASTER.md** (this file) | Navigation + quick reference | 3 min |
| **FAST_POS_CHANGES_SUMMARY.md** | Before/after comparison + high-level overview | 2 min |
| **FAST_POS_CLARIFICATIONS.md** | Detailed spec + implementation priority | 5 min |
| **fast_pos.md** | Complete design (mockups, architecture, reference) | 15 min |

---

## 🎯 Recommended Reading Order

### **If you have 5 minutes:**
1. Read this file (FAST_POS_MASTER.md) ← You are here
2. Skim FAST_POS_CHANGES_SUMMARY.md for what changed

### **If you have 15 minutes:**
1. This file (FAST_POS_MASTER.md)
2. FAST_POS_CLARIFICATIONS.md (detailed specs)
3. FAST_POS_CHANGES_SUMMARY.md (context)

### **If you're implementing:**
1. FAST_POS_CLARIFICATIONS.md (start here - specs + priority)
2. fast_pos.md (reference for UI/UX details)
3. This file (checklist)
4. FAST_POS_CHANGES_SUMMARY.md (context when stuck)

---

## 💡 Key Decision Points

### 1. Customer Name Field
- **Decision:** Autocomplete dropdown (not text input)
- **Why:** Faster for returning customers, reduces duplicates
- **API:** GET `/api/customers?search={query}`

### 2. Phone Field
- **Decision:** Optional (auto-fill 0000000000 if empty)
- **Why:** Some customers don't have phones, reduces friction
- **Note:** Only triggers detection if exactly 10 digits & != 0000000000

### 3. Pet Selection for Existing Customers
- **Decision:** Multi-select with checkboxes (new in Phase 1)
- **Why:** Some customers have multiple pets, faster to select existing ones
- **Edit:** Add [แก้ไขน้ำหนัก] button to update weight per pet

### 4. Service Selection
- **Decision:** Per-pet loop (if multiple pets selected)
- **Why:** Different services per pet, weight affects pricing
- **UI:** Show pet counter [1/2], [2/2] or tabs/accordion

### 5. Payment
- **Decision:** QR code only (no "Pay Now" button yet)
- **Why:** Payment integration in Phase 2
- **Button:** "บันทึก" or "[+ เพิ่มรถเข็น]"

---

## ⚠️ Important Notes

### Don't Forget:
- ✅ Auto-fill phone as "0000000000" when empty (before Step 2)
- ✅ Skip phone detection API if phone == "0000000000"
- ✅ Show pet counter/context in Step 3 (which pet you're selecting services for)
- ✅ Create `/api/sales` endpoint (doesn't exist yet)
- ✅ Update button text in Step 4 (remove "Pay Now")

### Watch Out For:
- ❌ Duplicate API calls (cache pet types, sizes, services)
- ❌ Phone detection running on every digit (debounce to 10 digits)
- ❌ Losing pet weight when editing (keep original, update only weight field)
- ❌ Service pricing without weight (always estimate size first)

---

## 📞 Questions?

If implementation details are unclear, check:
1. **What's the API response format?** → FAST_POS_CLARIFICATIONS.md (API Changes Needed section)
2. **What's the exact UI layout?** → fast_pos.md (mockups)
3. **What changed from original?** → FAST_POS_CHANGES_SUMMARY.md (Changes Summary)
4. **What's the priority order?** → FAST_POS_CLARIFICATIONS.md (Implementation Priority)

---

**Last Updated:** 2026-05-15
**Document Version:** 1.0
**Status:** Specification Complete ✅ | Implementation: Not Started ❌
