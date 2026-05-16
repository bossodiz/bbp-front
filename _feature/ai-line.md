# AI LINE OA Message Integration

## Overview
ระบบที่ใช้ Claude API เพื่อประมวลผลข้อความจาก LINE OA และบันทึกข้อมูลการจองหรือชำระเงินอัตโนมัติ

## Architecture

### 1. Component Flow
```
LINE OA Message
    ↓
Webhook Handler (POST /api/line/message)
    ↓
Message Filter & Validation
    ↓
Claude API (Intent Recognition)
    ↓
Intent Type Classifier
    ├─→ Booking Extraction
    ├─→ Payment Confirmation
    └─→ Other (Ignore)
    ↓
Data Persistence Layer
    ├─→ Database Save
    ├─→ Create/Update Booking
    └─→ Update Payment Status
    ↓
LINE OA Reply (Optional Confirmation)
```

### 2. Intent Types to Handle
- **Booking Messages**: "อยากจองอาบน้ำตัดขน", "เบิ้กวันไหน", "มีวันว่างไหม"
- **Payment Confirmation**: "ชำระเงินแล้ว", "ได้โอนเงินแล้ว", "จ่ายเสร็จแล้ว"
- **Other**: Messages ที่ไม่เกี่ยวข้อง (Filter out)

### 3. API Endpoints

#### POST /api/line/message
- Webhook endpoint สำหรับรับ messages จาก LINE
- Validate LINE signature (X-Line-Signature)
- Process message asynchronously

**Request Body:**
```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "ข้อความจากผู้ใช้"
      },
      "source": {
        "type": "user",
        "userId": "line_user_id"
      },
      "timestamp": 1234567890
    }
  ]
}
```

**Response:**
```json
{
  "status": "received"
}
```

### 4. Claude API Integration

#### Prompt for Message Analysis
```
Analyze the Thai message and determine:
1. Intent type: "BOOKING", "PAYMENT", or "OTHER"
2. Extracted data based on intent

For BOOKING:
- Service type (อาบน้ำตัดขน)
- Pet details (name, type, breed)
- Preferred date/time (if mentioned)
- Pet condition/notes

For PAYMENT:
- Booking ID reference
- Amount paid (if mentioned)
- Payment method (if mentioned)

Respond in JSON format only.
```

#### Response Format
```typescript
{
  "intent": "BOOKING" | "PAYMENT" | "OTHER",
  "confidence": 0.0 - 1.0,
  "data": {
    // booking or payment data
  },
  "raw_text": "original message"
}
```

### 5. Database Schema

#### table: line_messages
```sql
id (uuid)
line_user_id (string)
message_text (text)
intent_type (enum: BOOKING, PAYMENT, OTHER)
claude_response (json)
processed_at (timestamp)
created_at (timestamp)
```

#### Extensions to existing tables:
- `bookings` table: Add `line_user_id`, `line_message_id` fields
- `payments` table: Add `line_user_id`, `line_message_id` fields

### 6. Implementation Strategy

#### Phase 1: Core Webhook (Sprint 1)
- [ ] Create POST /api/line/message endpoint
- [ ] LINE signature validation
- [ ] Message queueing/logging

#### Phase 2: Claude Integration (Sprint 2)
- [ ] Integrate Claude API for intent detection
- [ ] Test with sample messages
- [ ] Implement rate limiting & caching

#### Phase 3: Auto-Save Logic (Sprint 3)
- [ ] Implement booking creation flow
- [ ] Implement payment confirmation flow
- [ ] Add LINE OA reply messages

#### Phase 4: Testing & Refinement (Sprint 4)
- [ ] Unit tests for intent detection
- [ ] Integration tests with real LINE webhook
- [ ] Performance optimization

### 7. File Structure
```
src/
├── api/
│   └── routes/
│       └── line.ts           (Webhook handlers)
├── services/
│   ├── line.service.ts       (LINE API integration)
│   ├── claude-ai.service.ts  (Claude API wrapper)
│   └── booking.service.ts    (Auto-create bookings)
├── middleware/
│   └── line-signature.ts     (LINE signature validation)
├── types/
│   └── line.types.ts         (TYPE definitions)
└── db/
    └── migrations/
        └── add_line_fields.sql
```

### 8. Configuration

#### Environment Variables
```
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx
LINE_ACCESS_TOKEN=xxx
CLAUDE_API_KEY=xxx
WEBHOOK_URL=https://domain.com/api/line/message
```

### 9. Error Handling

- Invalid LINE signature → Return 401
- Claude API error → Log + queue retry
- Database error → Log + notify admin
- Malformed message → Log + skip

### 10. Security Considerations

- ✅ LINE signature verification (X-Line-Signature)
- ✅ Rate limiting on webhook endpoint
- ✅ Validate user IDs from LINE
- ✅ Sanitize message text before storing
- ✅ Use API keys securely (env vars)
- ✅ Log sensitive operations (audit trail)

### 11. Testing Strategy

#### Unit Tests
- Intent classification accuracy
- Data extraction correctness
- Edge cases (empty text, special chars)

#### Integration Tests
- Full webhook flow
- Database integrity
- LINE signature validation

#### Manual Testing
- Real LINE OA account
- Sample booking messages
- Sample payment messages

---

## Questions for Discussion

1. ต้องการ auto-reply ข้อความยืนยันกลับ LINE หรือไม่?
2. ต้องการเก็บประวัติการจองแบบ draft (รอการยืนยัน) หรือเลย save เลย?
3. Payment confirmation ต้องมี validation เพิ่มเติมหรือไม่ (เช่น verify จากธนาคาร)?
4. ถ้า Claude ไม่สามารถตรวจจับได้ แล้ว notify user หรือทำอย่างไร?
