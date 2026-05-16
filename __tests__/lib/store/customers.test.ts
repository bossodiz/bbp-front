import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCustomerStore } from "@/lib/store/customers";
import { useCounterStore } from "@/lib/store/counter";
import type { Customer, Pet } from "@/lib/types";

/** Minimal customer payload (without id / pets / timestamps) */
const makeCustomerPayload = (
  overrides: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt" | "pets">> = {},
): Omit<Customer, "id" | "createdAt" | "updatedAt" | "pets"> => ({
  name: "Test Customer",
  phone: "0800000000",
  ...overrides,
});

/** Minimal pet payload */
const makePetPayload = (
  overrides: Partial<Omit<Pet, "id" | "customerId" | "createdAt" | "updatedAt">> = {},
): Omit<Pet, "id" | "customerId" | "createdAt" | "updatedAt"> => ({
  name: "Buddy",
  type: "DOG",
  breed: "Poodle",
  isMixedBreed: false,
  weight: 5,
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
  useCustomerStore.setState({ customers: [] });
  useCounterStore.setState({
    customerIdCounter: 1,
    petIdCounter: 1,
    serviceIdCounter: 1,
    promotionIdCounter: 1,
    bookingIdCounter: 1,
  });
});

describe("useCustomerStore", () => {
  describe("addPet", () => {
    it("adds pet to the correct customer only", () => {
      const { result } = renderHook(() => useCustomerStore());

      let cust1Id: number;
      let cust2Id: number;

      act(() => {
        cust1Id = result.current.addCustomer(makeCustomerPayload({ name: "Alice" })).id;
        cust2Id = result.current.addCustomer(makeCustomerPayload({ name: "Bob" })).id;
      });

      act(() => {
        result.current.addPet(cust1Id!, makePetPayload({ name: "Rex" }));
      });

      const cust1 = result.current.customers.find((c) => c.id === cust1Id);
      const cust2 = result.current.customers.find((c) => c.id === cust2Id);

      expect(cust1!.pets).toHaveLength(1);
      expect(cust1!.pets[0].name).toBe("Rex");
      expect(cust2!.pets).toHaveLength(0);
    });
  });

  describe("updatePet", () => {
    it("only changes the target pet, leaving others untouched", () => {
      const { result } = renderHook(() => useCustomerStore());

      let custId: number;
      let pet1Id: number;
      let pet2Id: number;

      act(() => {
        custId = result.current.addCustomer(makeCustomerPayload()).id;
      });

      act(() => {
        pet1Id = result.current.addPet(custId!, makePetPayload({ name: "Rex" })).id;
        pet2Id = result.current.addPet(custId!, makePetPayload({ name: "Max" })).id;
      });

      act(() => {
        result.current.updatePet(custId!, pet1Id!, { name: "Rex Updated" });
      });

      const customer = result.current.customers.find((c) => c.id === custId);
      const updatedPet = customer!.pets.find((p) => p.id === pet1Id);
      const untouchedPet = customer!.pets.find((p) => p.id === pet2Id);

      expect(updatedPet!.name).toBe("Rex Updated");
      expect(untouchedPet!.name).toBe("Max");
    });
  });

  describe("deletePet", () => {
    it("removes only the specific pet", () => {
      const { result } = renderHook(() => useCustomerStore());

      let custId: number;
      let petToDeleteId: number;
      let petToKeepId: number;

      act(() => {
        custId = result.current.addCustomer(makeCustomerPayload()).id;
      });

      act(() => {
        petToDeleteId = result.current.addPet(custId!, makePetPayload({ name: "Gone" })).id;
        petToKeepId = result.current.addPet(custId!, makePetPayload({ name: "Stays" })).id;
      });

      act(() => {
        result.current.deletePet(custId!, petToDeleteId!);
      });

      const customer = result.current.customers.find((c) => c.id === custId);
      expect(customer!.pets).toHaveLength(1);
      expect(customer!.pets[0].id).toBe(petToKeepId!);
      expect(customer!.pets[0].name).toBe("Stays");
    });
  });

  describe("searchCustomers", () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCustomerStore());
      act(() => {
        const cust1 = result.current.addCustomer(
          makeCustomerPayload({ name: "Alice Smith", phone: "0811111111" }),
        );
        result.current.addPet(cust1.id, makePetPayload({ name: "Buddy" }));

        const cust2 = result.current.addCustomer(
          makeCustomerPayload({ name: "Bob Jones", phone: "0822222222" }),
        );
        result.current.addPet(cust2.id, makePetPayload({ name: "Kitty", type: "CAT" }));
      });
    });

    it('returns ALL customers when query is ""', () => {
      const { result } = renderHook(() => useCustomerStore());
      const all = result.current.searchCustomers("");
      expect(all).toHaveLength(2);
    });

    it("matches on phone number", () => {
      const { result } = renderHook(() => useCustomerStore());
      const found = result.current.searchCustomers("0822222222");
      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("Bob Jones");
    });

    it("matches on customer name (case-insensitive)", () => {
      const { result } = renderHook(() => useCustomerStore());
      const found = result.current.searchCustomers("alice");
      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("Alice Smith");
    });

    it("matches on pet name", () => {
      const { result } = renderHook(() => useCustomerStore());
      const found = result.current.searchCustomers("Kitty");
      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("Bob Jones");
    });

    it("returns empty array when nothing matches", () => {
      const { result } = renderHook(() => useCustomerStore());
      const found = result.current.searchCustomers("zzznomatch");
      expect(found).toHaveLength(0);
    });

    it("whitespace-only query returns all customers", () => {
      const { result } = renderHook(() => useCustomerStore());
      const found = result.current.searchCustomers("   ");
      expect(found).toHaveLength(2);
    });
  });
});
