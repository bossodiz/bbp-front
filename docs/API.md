# API Documentation

ระบบจัดการร้านอาบน้ำตัดขนสัตว์ - API Reference

---

## 📋 สารบัญ

1. [Authentication](#authentication)
2. [Products API](#products-api)
3. [Sales API](#sales-api)
4. [Customers API](#customers-api)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

### CSRF Token

ทุก POST/PUT/DELETE request ต้องมี CSRF token:

```bash
# Get CSRF token
GET /api/csrf-token
# Response: { csrfToken: "..." }

# ใช้ใน header
x-csrf-token: <token>
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
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "อาบน้ำ",
      "price": 150,
      "active": true,
      "createdAt": "2026-05-14T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-05-14T10:30:45.123Z"
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
  "success": true,
  "data": { "id": 1, "name": "อาบน้ำ", ... },
  "timestamp": "2026-05-14T10:30:45.123Z"
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
  "success": true,
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
  "pagination": { ... },
  "timestamp": "2026-05-14T10:30:45.123Z"
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

---

## Customers API

*Implementation similar to Products API*

### Get All Customers
```
GET /api/customers?page=1&limit=20
```

### Create Customer
```
POST /api/customers
x-csrf-token: <token>
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "ข้อมูลไม่ถูกต้อง",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": ["ชื่อห้ามว่าง"]
  },
  "timestamp": "2026-05-14T10:30:45.123Z"
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input ไม่ถูกต้อง |
| `AUTH_ERROR` | 401 | ไม่ได้รับอนุญาต |
| `CSRF_TOKEN_INVALID` | 403 | CSRF token ไม่ถูกต้อง |
| `FORBIDDEN` | 403 | ไม่มีสิทธิ์ |
| `NOT_FOUND` | 404 | ไม่พบข้อมูล |
| `RATE_LIMIT_EXCEEDED` | 429 | ร้องขอมากเกินไป |
| `DATABASE_ERROR` | 500 | Database error |
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
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 30
  },
  "timestamp": "2026-05-14T10:30:45.123Z"
}
```

### Headers

```
Retry-After: 30 (seconds)
```

---

## Pagination

### Query Parameters

- `page` (int, default=1) - หน้า
- `limit` (int, default=20, max=100) - จำนวนต่อหน้า

### Response

```json
{
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
| 429 | Too Many Requests |
| 500 | Server Error |

---

**Last Updated**: 2026-05-14  
**Version**: 1.0.0
