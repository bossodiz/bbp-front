import { z } from "zod";

// ============================================================================
// PRODUCTS SCHEMAS
// ============================================================================

export const CreateProductSchema = z.object({
  name: z.string().min(1, "ชื่อสินค้าห้ามว่าง").trim(),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  price: z.number().positive("ราคาต้องมากกว่า 0"),
  cost: z.number().nonnegative("ต้นทุนต้องไม่เป็นลบ").optional().default(0),
  stockQuantity: z.number().nonnegative("จำนวนสต็อกต้องไม่เป็นลบ").optional().default(0),
  minStock: z.number().nonnegative("จำนวนสต็อกต่ำสุดต้องไม่เป็นลบ").optional().default(0),
  unit: z.string().optional().default("ชิ้น"),
  active: z.boolean().optional().default(true),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1, "ชื่อสินค้าห้ามว่าง").optional(),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  price: z.number().positive("ราคาต้องมากกว่า 0").optional(),
  cost: z.number().nonnegative("ต้นทุนต้องไม่เป็นลบ").optional(),
  stockQuantity: z.number().nonnegative("จำนวนสต็อกต้องไม่เป็นลบ").optional(),
  minStock: z.number().nonnegative("จำนวนสต็อกต่ำสุดต้องไม่เป็นลบ").optional(),
  unit: z.string().optional(),
  active: z.boolean().optional(),
}).strict();

// ============================================================================
// SALES SCHEMAS
// ============================================================================

export const SaleItemSchema = z.object({
  id: z.number().optional(),
  serviceId: z.number().optional(),
  serviceName: z.string(),
  petId: z.number().optional().nullable(),
  itemType: z.enum(["SERVICE", "PRODUCT"]).optional().default("SERVICE"),
  quantity: z.number().positive().optional().default(1),
  unitPrice: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  finalPrice: z.number().nonnegative(),
  isPriceModified: z.boolean().optional(),
});

export const CreateSalesSchema = z.object({
  bookingId: z.number().optional().nullable(),
  customerId: z.number().optional().nullable(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(SaleItemSchema).min(1, "ต้องมีรายการบริการอย่างน้อย 1 รายการ"),
  subtotal: z.number().nonnegative().optional().default(0),
  discountAmount: z.number().nonnegative().optional().default(0),
  promotionId: z.number().optional().nullable(),
  customDiscount: z.number().nonnegative().optional().default(0),
  depositUsed: z.number().nonnegative().optional().default(0),
  totalAmount: z.number().nonnegative(),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "TRANSFER"]),
  cashReceived: z.number().nonnegative().optional().nullable(),
  change: z.number().nonnegative().optional().nullable(),
  saleType: z.enum(["SERVICE", "PRODUCT", "MIXED"]).optional().default("SERVICE"),
  hotelBookingId: z.number().optional().nullable(),
  saleDate: z.string().datetime().optional(),
});

export const UpdateSalesDateSchema = z.object({
  saleDate: z.string().datetime("วันที่และเวลาต้องเป็นรูปแบบ ISO 8601"),
});

// ============================================================================
// CUSTOMERS SCHEMAS
// ============================================================================

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "ชื่อลูกค้าห้ามว่าง").trim(),
  phone: z.string().min(9, "เบอร์โทรต้องมีอย่างน้อย 9 หลัก").optional().nullable(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial().strict();

// ============================================================================
// BOOKINGS SCHEMAS
// ============================================================================

export const CreateBookingSchema = z.object({
  customerId: z.number().positive("ต้องเลือกลูกค้า"),
  petId: z.number().positive("ต้องเลือกสัตว์เลี้ยง"),
  serviceIds: z.array(z.number().positive()).min(1, "ต้องเลือกบริการอย่างน้อย 1 รายการ"),
  bookingDate: z.string().datetime("วันที่ต้องเป็นรูปแบบ ISO 8601"),
  notes: z.string().optional().nullable(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional().default("PENDING"),
});

export const BookingSchema = CreateBookingSchema.omit({ serviceIds: true }).extend({
  serviceIds: z.array(z.number()).optional(),
});

export const UpdateBookingSchema = BookingSchema.partial().strict();

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  password: z.string().min(1, "รหัสผ่านห้ามว่าง"),
});

// ============================================================================
// TYPE EXPORTS - ใช้สำหรับ TypeScript inference
// ============================================================================

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateSalesInput = z.infer<typeof CreateSalesSchema>;
export type UpdateSalesDateInput = z.infer<typeof UpdateSalesDateSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
