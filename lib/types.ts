// Customer Types
export interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  pets: Pet[];
}

export interface Pet {
  id: number;
  customerId: number;
  name: string;
  type: "DOG" | "CAT";
  breed: string;
  breed2?: string;
  isMixedBreed: boolean;
  weight: number; // น้ำหนักเป็น KG
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pet Type Configuration (customizable)
export interface PetTypeConfig {
  id: string;
  name: string;
  icon?: string;
  order: number;
  active: boolean; // สถานะเปิด/ปิดชั่วคราว
}

// Size Configuration (customizable) - แยกตามประเภทสัตว์
export interface SizeConfig {
  id: string;
  petTypeId: string; // อ้างอิงถึง PetTypeConfig.id
  name: string;
  minWeight?: number; // น้ำหนักต่ำสุด (kg)
  maxWeight?: number; // น้ำหนักสูงสุด (kg)
  description?: string; // e.g. "2-4kg"
  order: number;
  active: boolean; // สถานะเปิด/ปิดชั่วคราว
}

// Service Types
export interface Service {
  id: number;
  name: string;
  description?: string;
  isSpecial: boolean; // บริการพิเศษไม่เกี่ยวกับประเภทสัตว์/ขนาด
  specialPrice?: number; // ราคาเดียวสำหรับบริการพิเศษ
  active: boolean; // สถานะเปิด/ปิดชั่วคราว
  order: number; // ลำดับการแสดงผล
  createdAt: Date;
  updatedAt: Date;
  prices: ServicePrice[];
}

export interface ServicePrice {
  id: number;
  serviceId: number;
  petTypeId?: string; // Optional for special services
  sizeId?: string; // Optional for special services
  price: number;
}

// Promotion Types
export interface Promotion {
  id: number;
  name: string;
  type: "PERCENT" | "AMOUNT" | "FREE_SERVICE";
  value: number;
  freeServiceId?: number;
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Booking Types
export interface BookingPet {
  petId: number;
  name: string;
  type: "DOG" | "CAT";
  breed: string;
  service: string;
}

export interface Booking {
  id: number;
  customerId?: number;
  customerName: string;
  phone: string;
  pets?: BookingPet[]; // รายการสัตว์เลี้ยงพร้อมข้อมูล
  petIds?: number[]; // รองรับเลือกสัตว์เลี้ยงหลายตัว (สำหรับ POST/PUT)
  serviceType: string;
  bookingDate: Date;
  bookingTime: string;
  note?: string;
  depositAmount: number;
  depositStatus: "NONE" | "HELD" | "USED" | "FORFEITED";
  depositForfeitedDate?: Date;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

// สำหรับสร้างสัตว์เลี้ยงใหม่พร้อมนัดหมาย
export interface NewPetData {
  name: string;
  type: "DOG" | "CAT";
  breed: string;
  breed2?: string;
  isMixedBreed: boolean;
  weight: number;
  note?: string;
}

// POS Types
export interface POSOrder {
  id: number;
  customerId?: number;
  petId?: number;
  bookingId?: number;
  subtotal: number;
  discountAmount: number;
  depositUsed: number;
  totalAmount: number;
  createdAt: Date;
  items: POSOrderItem[];
  payments: Payment[];
}

export interface POSOrderItem {
  id: number;
  posOrderId: number;
  serviceId: number;
  serviceName: string;
  originalPrice: number;
  finalPrice: number;
  isPriceModified: boolean;
}

export interface Payment {
  id: number;
  posOrderId: number;
  method: "CASH" | "QR" | "CREDIT_CARD";
  amount: number;
  createdAt: Date;
}

// Utility types
export type PetType = "DOG" | "CAT"; // For pet registration (still fixed)
export type DepositStatus = "NONE" | "HELD" | "USED" | "FORFEITED";
export type PaymentMethod = "CASH" | "QR" | "CREDIT_CARD";
export type PromotionType = "PERCENT" | "AMOUNT" | "FREE_SERVICE";

// Label maps for display (for pet registration)
export const petTypeLabels: Record<PetType, string> = {
  DOG: "หมา",
  CAT: "แมว",
};

export const depositStatusLabels: Record<DepositStatus, string> = {
  NONE: "ไม่มีมัดจำ",
  HELD: "มีมัดจำ",
  USED: "ใช้แล้ว",
  FORFEITED: "ยึดมัดจำ",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "เงินสด",
  QR: "QR Code",
  CREDIT_CARD: "บัตรเครดิต",
};

export const promotionTypeLabels: Record<PromotionType, string> = {
  PERCENT: "ลดเปอร์เซ็นต์",
  AMOUNT: "ลดเป็นบาท",
  FREE_SERVICE: "แถมบริการ",
};
