# API Documentation

ระบบจัดการร้านอาบน้ำตัดขนสัตว์ - API Reference

---

## 📋 สารบัญ

1. [Response Envelope](#response-envelope)
2. [Authentication](#authentication)
3. [Products API](#products-api)
4. [Sales API](#sales-api)
5. [Customers API](#customers-api)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Response Envelope

**ทุก endpoint ของ shop API คืน envelope แบบเดียวกัน:** `{ data, error }`

| กรณี | HTTP status | รูปแบบ |
| --- | --- | --- |
| สำเร็จ | 2xx | `{ "data": <payload>, "error": null }` |
| สำเร็จ + list ที่มี pagination | 2xx | `{ "data": [...], "error": null, "pagination": {...} }` |
| ล้มเหลว | 4xx/5xx | `{ "data": null, "error": "ข้อความ", "code": "CODE" }` |

กติกา:
- **ตรวจว่าสำเร็จหรือไม่จาก HTTP status เท่านั้น** (ไม่มี field `success`) — 2xx = สำเร็จ
- อ่านข้อมูลจาก `data` เสมอ · ตอนสำเร็จ `error` เป็น `null`
- ตอนล้มเหลว อ่านข้อความจาก `error` (string) · `code` เป็นรหัสเครื่อง (machine code) ไว้แยกประเภท
- `code` และ `pagination` จะโผล่ใน JSON เฉพาะเมื่อมีค่า (ไม่มีใน success response ปกติ)

> ฝั่ง frontend ใช้ helper กลางที่ [`lib/api.ts`](../lib/api.ts) (`apiFetch` / `apiSend`) unwrap `data` และ throw `ApiError` ตอน status ไม่ 2xx — ไม่ต้อง parse envelope เองในแต่ละ hook

---

## Authentication

### CSRF Token

ขอ CSRF token:

```bash
GET /api/csrf-token
# Response: { "data": { "csrfToken": "...", "timestamp": "..." }, "error": null }

# ใช้ใน header ของ mutation
x-csrf-token: <token>
```

### Login / Logout

```bash
POST /api/auth/login    { "password": "..." }
# สำเร็จ → set-cookie bbp_auth (httpOnly) + { "data": { "success": true }, "error": null }
# ล้มเหลว → 401 { "data": null, "error": "รหัสผ่านไม่ถูกต้อง", "code": "AUTH_ERROR" }

POST /api/auth/logout
# → clear cookie + { "data": { "success": true }, "error": null }
```

---

## Products API

### Get All Products (with Pagination)

```
GET /api/products?page=1&limit=20&active=true&category=SERVICE
```

**Parameters:**
- `page` - หน้า (default: 1)
- `limit` - จำนวนต่อหน้า 1-100 (default: 20)
- `active` - แสดงเฉพาะสินค้าที่ใช้งาน (optional)
- `category` - filter ตามหมวด (optional)

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "อาบน้ำ",
      "price": 150,
      "active": true,
      "createdAt": "2026-05-14T10:00:00Z"
    }
  ],
  "error": null,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Create Product

```
POST /api/products
x-csrf-token: <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "อาบน้ำ",
  "sku": "BATH-001",
  "description": "บริการอาบน้ำสำหรับสุนัข",
  "category": "SERVICE",
  "price": 150,
  "cost": 50,
  "stockQuantity": 0,
  "minStock": 0,
  "unit": "ครั้ง",
  "active": true
}
```

**Response (201):**
```json
{
  "data": { "id": 1, "name": "อาบน้ำ" },
  "error": null
}
```

**Errors:**
- `400 VALIDATION_ERROR` - ข้อมูลไม่ถูกต้อง
- `403 CSRF_TOKEN_INVALID` - Token ไม่ถูกต้อง
- `429 RATE_LIMIT_EXCEEDED` - ร้องขอมากเกินไป

### Update Product

```
PUT /api/products/:id
x-csrf-token: <token>
```

### Delete Product

```
DELETE /api/products/:id
x-csrf-token: <token>
```

---

## Sales API

### Get All Sales (with Pagination)

```
GET /api/sales?page=1&limit=20&startDate=2026-05-01&endDate=2026-05-31&customerId=1
```

**Parameters:**
- `page` - หน้า (default: 1)
- `limit` - จำนวนต่อหน้า (default: 20)
- `startDate` - วันเริ่มต้น (ISO 8601) (optional)
- `endDate` - วันสิ้นสุด (ISO 8601) (optional)
- `customerId` - filter ตามลูกค้า (optional)

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "customerId": 1,
      "customerName": "สมชาย",
      "totalAmount": 500,
      "paymentMethod": "CASH",
      "items": [
        {
          "id": 1,
          "serviceName": "อาบน้ำ",
          "quantity": 1,
          "finalPrice": 500
        }
      ],
      "createdAt": "2026-05-14T10:00:00Z"
    }
  ],
  "error": null,
  "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3, "hasNext": true, "hasPrev": false }
}
```

### Create Sale

```
POST /api/sales
x-csrf-token: <token>
```

**Body:**
```json
{
  "customerId": 1,
  "items": [
    {
      "serviceName": "อาบน้ำ",
      "finalPrice": 150,
      "quantity": 1
    }
  ],
  "totalAmount": 150,
  "paymentMethod": "CASH",
  "cashReceived": 200
}
```

**Response (201):**
```json
{ "data": { "saleId": 42 }, "error": null }
```

---

## Customers API

*Implementation similar to Products API — คืน `{ data, error }` เหมือนกัน (rows เป็น snake_case + nested `pets`)*

### Get All Customers
```
GET /api/customers?search=สมชาย
# Response: { "data": [ { "id": 1, "name": "...", "pets": [...] } ], "error": null }
```

### Create Customer
```
POST /api/customers
x-csrf-token: <token>
```

---

## Error Handling

### Standard Error Response

ทุก error คืน envelope เดียวกัน — status บอกประเภท, `error` เป็นข้อความ, `code` เป็นรหัสเครื่อง:

```json
{
  "data": null,
  "error": "ข้อมูลไม่ถูกต้อง",
  "code": "VALIDATION_ERROR"
}
```

> Validation error จะใส่ข้อความของ field แรกที่ผิดไว้ใน `error` (เช่น `"ชื่อห้ามว่าง"`)

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input ไม่ถูกต้อง |
| `AUTH_ERROR` | 401 | ไม่ได้รับอนุญาต |
| `CSRF_TOKEN_INVALID` | 403 | CSRF token ไม่ถูกต้อง |
| `FORBIDDEN` | 403 | ไม่มีสิทธิ์ |
| `NOT_FOUND` | 404 | ไม่พบข้อมูล |
| `CONFLICT` | 409 | ข้อมูลซ้ำ/ขัดแย้ง (เช่น ชื่อสัตว์เลี้ยงซ้ำ) |
| `RATE_LIMIT_EXCEEDED` | 429 | ร้องขอมากเกินไป |
| `SERVER_ERROR` | 500 | Server error |

---

## Rate Limiting

### Limits

```
Standard Endpoints: 60 requests/minute per IP
Login Endpoint:     5 requests/15 minutes per IP
Strict Endpoints:   10 requests/minute per IP
```

### Rate Limit Response

```json
{
  "data": null,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Headers

```
Retry-After: 30 (seconds)
```

จำนวนวินาทีที่ต้องรอส่งกลับผ่าน header `Retry-After` (ไม่ได้อยู่ใน body แล้ว)

---

## Pagination

### Query Parameters

- `page` (int, default=1) - หน้า
- `limit` (int, default=20, max=100) - จำนวนต่อหน้า

### Response

`pagination` เป็น sibling field ข้าง `data` (ไม่ซ้อนใน data):

```json
{
  "data": [ ],
  "error": null,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success - GET/PUT/DELETE |
| 201 | Created - POST |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden (CSRF/auth issues) |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Server Error |

---

**Last Updated**: 2026-07-24
**Version**: 2.0.0 — unified `{ data, error }` envelope across all shop endpoints
