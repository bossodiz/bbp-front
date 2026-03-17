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
  weight: number | null; // น้ำหนักเป็น KG (nullable - ไม่บังคับ)
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
  type: "PERCENT" | "AMOUNT";
  value: number;
  freeServiceId?: number;
  applicableTo: ApplicableTo;
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price: number;
  cost: number;
  stockQuantity: number;
  minStock: number;
  unit: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const productCategoryOptions = [
  "อาหาร",
  "ขนม",
  "ของเล่น",
  "อุปกรณ์",
  "เวชภัณฑ์",
  "แชมพู/สบู่",
  "เสื้อผ้า",
  "อื่นๆ",
] as const;

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
  customerId: number; // Required - reference to customers table
  customerName?: string; // Optional - comes from join with customers table
  phone?: string; // Optional - comes from join with customers table
  pets?: BookingPet[]; // รายการสัตว์เลี้ยงพร้อมข้อมูล
  petIds?: number[]; // รองรับเลือกสัตว์เลี้ยงหลายตัว (สำหรับ POST/PUT)
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
  weight: number | null; // nullable - ไม่บังคับ
  note?: string;
}

// Sale Types
export interface Sale {
  id: number;
  bookingId?: number;
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  saleType: SaleType;
  hotelBookingId?: number;
  subtotal: number;
  discountAmount: number;
  promotionId?: number;
  customDiscount: number;
  depositUsed: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
  createdAt: Date;
  items: SaleItem[];
}

export interface SaleItem {
  id: number;
  saleId: number;
  serviceId: number;
  serviceName: string;
  petId?: number;
  petName?: string;
  petType?: "DOG" | "CAT";
  itemType: ItemType;
  quantity: number;
  unitPrice: number;
  productId?: number;
  originalPrice: number;
  finalPrice: number;
  isPriceModified: boolean;
}

// POS Types (kept for backward compatibility)
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

// Hotel Types
export type HotelBookingStatus =
  | "RESERVED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

export interface HotelAdditionalService {
  id: number;
  hotelBookingId: number;
  serviceId?: number;
  serviceName: string;
  originalPrice: number;
  finalPrice: number;
  isPriceModified: boolean;
}

export interface HotelBooking {
  id: number;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  pets?: Array<{
    id?: number;
    name: string;
    type: "DOG" | "CAT";
    breed?: string;
    weight?: number;
  }>;
  checkInDate: string;
  checkOutDate?: string;
  ratePerNight: number;
  totalNights?: number;
  roomTotal: number;
  depositAmount: number;
  depositStatus: DepositStatus;
  additionalServicesTotal: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod?: PaymentMethod;
  note?: string;
  status: HotelBookingStatus;
  additionalServices?: HotelAdditionalService[];
  createdAt: Date;
  updatedAt: Date;
}

export const hotelStatusLabels: Record<HotelBookingStatus, string> = {
  RESERVED: "จองแล้ว",
  CHECKED_IN: "เข้าพักอยู่",
  CHECKED_OUT: "รับกลับแล้ว",
  CANCELLED: "ยกเลิก",
};

// Utility types
export type PetType = "DOG" | "CAT"; // For pet registration (still fixed)
export type DepositStatus = "NONE" | "HELD" | "USED" | "FORFEITED";
export type PaymentMethod = "CASH" | "QR" | "CREDIT_CARD";
export type PromotionType = "PERCENT" | "AMOUNT";
export type SaleType = "SERVICE" | "HOTEL" | "PRODUCT" | "MIXED";
export type ItemType = "SERVICE" | "HOTEL_ROOM" | "PRODUCT";
export type ApplicableTo = "ALL" | "SERVICE" | "HOTEL" | "PRODUCT";

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
};

export const saleTypeLabels: Record<SaleType, string> = {
  SERVICE: "บริการ",
  HOTEL: "โรงแรม",
  PRODUCT: "สินค้า",
  MIXED: "ผสม",
};

export const itemTypeLabels: Record<ItemType, string> = {
  SERVICE: "บริการ",
  HOTEL_ROOM: "ค่าห้องพัก",
  PRODUCT: "สินค้า",
};

export const applicableToLabels: Record<ApplicableTo, string> = {
  ALL: "ทั้งหมด",
  SERVICE: "บริการ",
  HOTEL: "โรงแรม",
  PRODUCT: "สินค้า",
};
