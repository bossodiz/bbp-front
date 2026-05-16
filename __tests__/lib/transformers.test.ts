import { describe, it, expect } from "vitest";
import {
  transformCustomer,
  transformPet,
  transformService,
  transformServicePrice,
} from "@/lib/utils/transformers";

describe("transformPet", () => {
  it("transforms a pet with all fields", () => {
    const raw = {
      id: 1,
      customer_id: 10,
      name: "Rex",
      type: "DOG" as const,
      breed: "Labrador",
      breed_2: "Poodle",
      is_mixed_breed: true,
      weight: "12.5",
      note: "Friendly",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-06-01T00:00:00.000Z",
    };

    const pet = transformPet(raw);

    expect(pet.id).toBe(1);
    expect(pet.customerId).toBe(10);
    expect(pet.name).toBe("Rex");
    expect(pet.type).toBe("DOG");
    expect(pet.breed).toBe("Labrador");
    expect(pet.breed2).toBe("Poodle");
    expect(pet.isMixedBreed).toBe(true);
    expect(pet.weight).toBe(12.5);
    expect(pet.note).toBe("Friendly");
    expect(pet.createdAt).toBeInstanceOf(Date);
    expect(pet.updatedAt).toBeInstanceOf(Date);
  });

  it("transforms a mixed breed pet with null weight", () => {
    const raw = {
      id: 2,
      customer_id: 5,
      name: "Luna",
      type: "CAT" as const,
      breed: "Siamese",
      breed_2: null,
      is_mixed_breed: true,
      weight: null,
      note: null,
      created_at: "2024-02-01T00:00:00.000Z",
      updated_at: "2024-02-01T00:00:00.000Z",
    };

    const pet = transformPet(raw);

    expect(pet.weight).toBeNull();
    expect(pet.breed2).toBeUndefined();
    expect(pet.note).toBe("");
    expect(pet.isMixedBreed).toBe(true);
  });
});

describe("transformServicePrice", () => {
  it("transforms a service price", () => {
    const raw = {
      id: 100,
      service_id: 5,
      pet_type_id: "DOG",
      size_id: "SMALL",
      price: 350,
    };

    const price = transformServicePrice(raw);

    expect(price.id).toBe(100);
    expect(price.serviceId).toBe(5);
    expect(price.petTypeId).toBe("DOG");
    expect(price.sizeId).toBe("SMALL");
    expect(price.price).toBe(350);
  });

  it("transforms a service price with null optional fields", () => {
    const raw = {
      id: 101,
      service_id: 6,
      pet_type_id: null,
      size_id: null,
      price: 500,
    };

    const price = transformServicePrice(raw);

    expect(price.petTypeId).toBeUndefined();
    expect(price.sizeId).toBeUndefined();
    expect(price.price).toBe(500);
  });
});

describe("transformService", () => {
  it("transforms a service with prices array", () => {
    const raw = {
      id: 1,
      name: "Bath",
      description: "Dog bath service",
      is_special: false,
      special_price: null,
      active: true,
      order_index: 2,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-15T00:00:00.000Z",
      service_prices: [
        { id: 10, service_id: 1, pet_type_id: "DOG", size_id: "SMALL", price: 200 },
        { id: 11, service_id: 1, pet_type_id: "DOG", size_id: "LARGE", price: 400 },
      ],
    };

    const service = transformService(raw);

    expect(service.id).toBe(1);
    expect(service.name).toBe("Bath");
    expect(service.description).toBe("Dog bath service");
    expect(service.isSpecial).toBe(false);
    expect(service.specialPrice).toBeUndefined();
    expect(service.active).toBe(true);
    expect(service.order).toBe(2);
    expect(service.createdAt).toBeInstanceOf(Date);
    expect(service.updatedAt).toBeInstanceOf(Date);
    expect(service.prices).toHaveLength(2);
    expect(service.prices[0].serviceId).toBe(1);
    expect(service.prices[0].petTypeId).toBe("DOG");
    expect(service.prices[0].sizeId).toBe("SMALL");
    expect(service.prices[0].price).toBe(200);
  });

  it("transforms a service with undefined service_prices", () => {
    const raw = {
      id: 2,
      name: "Nail Trim",
      description: undefined,
      is_special: true,
      special_price: 150,
      active: true,
      order_index: 1,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      service_prices: undefined,
    };

    const service = transformService(raw);

    expect(service.prices).toEqual([]);
    expect(service.isSpecial).toBe(true);
    expect(service.specialPrice).toBe(150);
    expect(service.description).toBeUndefined();
  });
});

describe("transformCustomer", () => {
  it("transforms a customer with full valid data including pets", () => {
    const raw = {
      id: 1,
      name: "John Doe",
      phone: "0812345678",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-06-01T00:00:00.000Z",
      pets: [
        {
          id: 10,
          customer_id: 1,
          name: "Max",
          type: "DOG" as const,
          breed: "Golden Retriever",
          breed_2: null,
          is_mixed_breed: false,
          weight: "25",
          note: "Loves fetch",
          created_at: "2024-02-01T00:00:00.000Z",
          updated_at: "2024-02-01T00:00:00.000Z",
        },
      ],
    };

    const customer = transformCustomer(raw);

    expect(customer.id).toBe(1);
    expect(customer.name).toBe("John Doe");
    expect(customer.phone).toBe("0812345678");
    expect(customer.createdAt).toBeInstanceOf(Date);
    expect(customer.updatedAt).toBeInstanceOf(Date);
    expect(customer.pets).toHaveLength(1);
    expect(customer.pets[0].name).toBe("Max");
    expect(customer.pets[0].weight).toBe(25);
    expect(customer.pets[0].customerId).toBe(1);
  });

  it("transforms a customer with null weight pet and no pets array", () => {
    const raw = {
      id: 2,
      name: "Jane Smith",
      phone: "0899999999",
      created_at: "2024-03-01T00:00:00.000Z",
      updated_at: "2024-03-01T00:00:00.000Z",
    };

    const customer = transformCustomer(raw);

    expect(customer.id).toBe(2);
    expect(customer.name).toBe("Jane Smith");
    expect(customer.pets).toEqual([]);
  });
});
