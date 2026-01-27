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
}

// Size Configuration (customizable)
export interface SizeConfig {
  id: string;
  name: string;
  description?: string; // e.g. "2-4kg"
  order: number;
}

// Service Types
export interface Service {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  prices: ServicePrice[];
}

export interface ServicePrice {
  id: number;
  serviceId: number;
  petTypeId: string; // Reference to PetTypeConfig.id
  sizeId: string; // Reference to SizeConfig.id
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
  createdAt: Date;
}

// Booking Types
export interface Booking {
  id: number;
  customerName: string;
  phone: string;
  petType: "DOG" | "CAT";
  serviceType: string;
  bookingDate: Date;
  bookingTime: string;
  note?: string;
  depositAmount: number;
  depositStatus: "NONE" | "HELD" | "USED" | "FORFEITED";
  depositForfeitedDate?: Date;
  createdAt: Date;
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
