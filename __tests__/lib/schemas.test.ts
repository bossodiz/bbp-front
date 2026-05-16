import { describe, it, expect } from "vitest";
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  CreatePromotionSchema,
  UpdatePromotionSchema,
  CreateHotelBookingSchema,
  UpdateHotelBookingSchema,
  PetTypeConfigSchema,
  SizeConfigSchema,
  CreateBookingApiSchema,
} from "@/lib/schemas";

// ============================================================================
// SERVICE SCHEMAS
// ============================================================================

describe("CreateServiceSchema", () => {
  it("should accept valid regular service input", () => {
    const result = CreateServiceSchema.safeParse({
      name: "อาบน้ำตัดขน",
      isSpecial: false,
      prices: [{ petTypeId: "dog", sizeId: "small", price: 200 }],
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid special service input", () => {
    const result = CreateServiceSchema.safeParse({
      name: "บริการพิเศษ",
      isSpecial: true,
      specialPrice: 500,
    });
    expect(result.success).toBe(true);
  });

  it("should apply default values", () => {
    const result = CreateServiceSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isSpecial).toBe(false);
      expect(result.data.order).toBe(0);
      expect(result.data.prices).toEqual([]);
    }
  });

  it("should fail when name is missing", () => {
    const result = CreateServiceSchema.safeParse({ isSpecial: false });
    expect(result.success).toBe(false);
  });

  it("should fail when name is empty string", () => {
    const result = CreateServiceSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("should fail when name is wrong type", () => {
    const result = CreateServiceSchema.safeParse({ name: 123 });
    expect(result.success).toBe(false);
  });

  it("should fail when isSpecial is wrong type", () => {
    const result = CreateServiceSchema.safeParse({ name: "Test", isSpecial: "yes" });
    expect(result.success).toBe(false);
  });
});

describe("UpdateServiceSchema", () => {
  it("should accept partial input", () => {
    const result = UpdateServiceSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = UpdateServiceSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject unknown fields (strict)", () => {
    const result = UpdateServiceSchema.safeParse({ name: "Test", unknownField: "x" });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// PROMOTION SCHEMAS
// ============================================================================

describe("CreatePromotionSchema", () => {
  it("should accept valid promotion input", () => {
    const result = CreatePromotionSchema.safeParse({
      name: "ลด 10%",
      type: "PERCENT",
      value: 10,
      applicableTo: "ALL",
    });
    expect(result.success).toBe(true);
  });

  it("should apply default active = true", () => {
    const result = CreatePromotionSchema.safeParse({
      name: "ลด 50 บาท",
      type: "AMOUNT",
      value: 50,
      applicableTo: "SERVICE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });

  it("should fail when name is missing", () => {
    const result = CreatePromotionSchema.safeParse({
      type: "PERCENT",
      value: 10,
      applicableTo: "ALL",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when type is invalid enum", () => {
    const result = CreatePromotionSchema.safeParse({
      name: "Test",
      type: "INVALID",
      value: 10,
      applicableTo: "ALL",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when applicableTo is invalid", () => {
    const result = CreatePromotionSchema.safeParse({
      name: "Test",
      type: "PERCENT",
      value: 10,
      applicableTo: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when value is not positive", () => {
    const result = CreatePromotionSchema.safeParse({
      name: "Test",
      type: "PERCENT",
      value: -5,
      applicableTo: "ALL",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when value is wrong type", () => {
    const result = CreatePromotionSchema.safeParse({
      name: "Test",
      type: "PERCENT",
      value: "ten",
      applicableTo: "ALL",
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdatePromotionSchema", () => {
  it("should accept partial input", () => {
    const result = UpdatePromotionSchema.safeParse({ active: false });
    expect(result.success).toBe(true);
  });

  it("should reject unknown fields (strict)", () => {
    const result = UpdatePromotionSchema.safeParse({ unknownField: "x" });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// HOTEL BOOKING SCHEMAS
// ============================================================================

describe("CreateHotelBookingSchema", () => {
  it("should accept valid hotel booking input", () => {
    const result = CreateHotelBookingSchema.safeParse({
      customerId: 1,
      petIds: [2, 3],
      checkInDate: "2025-06-01",
      ratePerNight: 500,
    });
    expect(result.success).toBe(true);
  });

  it("should apply default depositAmount = 0", () => {
    const result = CreateHotelBookingSchema.safeParse({
      customerId: 1,
      petIds: [1],
      checkInDate: "2025-06-01",
      ratePerNight: 300,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depositAmount).toBe(0);
      expect(result.data.depositStatus).toBe("NONE");
    }
  });

  it("should fail when customerId is missing", () => {
    const result = CreateHotelBookingSchema.safeParse({
      petIds: [1],
      checkInDate: "2025-06-01",
      ratePerNight: 300,
    });
    expect(result.success).toBe(false);
  });

  it("should fail when petIds is empty", () => {
    const result = CreateHotelBookingSchema.safeParse({
      customerId: 1,
      petIds: [],
      checkInDate: "2025-06-01",
      ratePerNight: 300,
    });
    expect(result.success).toBe(false);
  });

  it("should fail when checkInDate is missing", () => {
    const result = CreateHotelBookingSchema.safeParse({
      customerId: 1,
      petIds: [1],
      ratePerNight: 300,
    });
    expect(result.success).toBe(false);
  });

  it("should fail when ratePerNight is not positive", () => {
    const result = CreateHotelBookingSchema.safeParse({
      customerId: 1,
      petIds: [1],
      checkInDate: "2025-06-01",
      ratePerNight: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should fail when customerId is wrong type", () => {
    const result = CreateHotelBookingSchema.safeParse({
      customerId: "one",
      petIds: [1],
      checkInDate: "2025-06-01",
      ratePerNight: 300,
    });
    expect(result.success).toBe(false);
  });

  it("should fail when depositStatus is invalid", () => {
    const result = CreateHotelBookingSchema.safeParse({
      customerId: 1,
      petIds: [1],
      checkInDate: "2025-06-01",
      ratePerNight: 300,
      depositStatus: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateHotelBookingSchema", () => {
  it("should accept partial input", () => {
    const result = UpdateHotelBookingSchema.safeParse({ note: "Updated note" });
    expect(result.success).toBe(true);
  });

  it("should reject unknown fields (strict)", () => {
    const result = UpdateHotelBookingSchema.safeParse({ extraField: true });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// CONFIG SCHEMAS
// ============================================================================

describe("PetTypeConfigSchema", () => {
  it("should accept valid pet type config", () => {
    const result = PetTypeConfigSchema.safeParse({
      id: "dog",
      name: "สุนัข",
    });
    expect(result.success).toBe(true);
  });

  it("should apply defaults", () => {
    const result = PetTypeConfigSchema.safeParse({ id: "cat", name: "แมว" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
      expect(result.data.order_index).toBe(0);
    }
  });

  it("should fail when id is missing", () => {
    const result = PetTypeConfigSchema.safeParse({ name: "สุนัข" });
    expect(result.success).toBe(false);
  });

  it("should fail when name is missing", () => {
    const result = PetTypeConfigSchema.safeParse({ id: "dog" });
    expect(result.success).toBe(false);
  });

  it("should fail when id is wrong type", () => {
    const result = PetTypeConfigSchema.safeParse({ id: 1, name: "Test" });
    expect(result.success).toBe(false);
  });
});

describe("SizeConfigSchema", () => {
  it("should accept valid size config", () => {
    const result = SizeConfigSchema.safeParse({
      id: "small",
      petTypeId: "dog",
      name: "เล็ก",
    });
    expect(result.success).toBe(true);
  });

  it("should apply defaults", () => {
    const result = SizeConfigSchema.safeParse({
      id: "small",
      petTypeId: "dog",
      name: "เล็ก",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
      expect(result.data.order_index).toBe(0);
    }
  });

  it("should fail when petTypeId is missing", () => {
    const result = SizeConfigSchema.safeParse({ id: "small", name: "เล็ก" });
    expect(result.success).toBe(false);
  });

  it("should fail when name is missing", () => {
    const result = SizeConfigSchema.safeParse({ id: "small", petTypeId: "dog" });
    expect(result.success).toBe(false);
  });

  it("should fail when minWeight is negative", () => {
    const result = SizeConfigSchema.safeParse({
      id: "small",
      petTypeId: "dog",
      name: "เล็ก",
      minWeight: -1,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// BOOKING API SCHEMA
// ============================================================================

describe("CreateBookingApiSchema", () => {
  it("should accept valid booking input", () => {
    const result = CreateBookingApiSchema.safeParse({
      customerId: 1,
      bookingDate: "2025-06-01",
      bookingTime: "10:00",
    });
    expect(result.success).toBe(true);
  });

  it("should apply defaults", () => {
    const result = CreateBookingApiSchema.safeParse({
      customerId: 1,
      bookingDate: "2025-06-01",
      bookingTime: "10:00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depositAmount).toBe(0);
      expect(result.data.depositStatus).toBe("NONE");
      expect(result.data.status).toBe("PENDING");
      expect(result.data.petServicePairs).toEqual([]);
    }
  });

  it("should fail when customerId is missing", () => {
    const result = CreateBookingApiSchema.safeParse({
      bookingDate: "2025-06-01",
      bookingTime: "10:00",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when bookingDate is missing", () => {
    const result = CreateBookingApiSchema.safeParse({
      customerId: 1,
      bookingTime: "10:00",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when bookingTime is missing", () => {
    const result = CreateBookingApiSchema.safeParse({
      customerId: 1,
      bookingDate: "2025-06-01",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when customerId is wrong type", () => {
    const result = CreateBookingApiSchema.safeParse({
      customerId: "one",
      bookingDate: "2025-06-01",
      bookingTime: "10:00",
    });
    expect(result.success).toBe(false);
  });
});
