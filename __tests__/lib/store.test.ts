import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, it, expect } from "vitest";
import {
  useCustomerStore,
  useServiceStore,
  useCounterStore,
  useBookingStore,
} from "@/lib/store";

describe("Zustand Stores", () => {
  beforeEach(() => {
    localStorage.clear();
    useCounterStore.setState({
      customerIdCounter: 1,
      petIdCounter: 1,
      serviceIdCounter: 1,
      promotionIdCounter: 1,
      bookingIdCounter: 1,
    });
    useCustomerStore.setState({ customers: [] });
    useServiceStore.setState({ services: [] });
    useBookingStore.setState({ bookings: [] });
  });

  describe("useCounterStore", () => {
    it("should initialize counters", () => {
      const { result } = renderHook(() => useCounterStore());
      expect(result.current.customerIdCounter).toBeGreaterThanOrEqual(1);
      expect(result.current.petIdCounter).toBeGreaterThanOrEqual(1);
    });

    it("should increment customer ID", () => {
      const { result } = renderHook(() => useCounterStore());
      let id1: number, id2: number;
      act(() => {
        id1 = result.current.incrementCustomerId();
        id2 = result.current.incrementCustomerId();
      });
      expect(id2!).toBeGreaterThan(id1!);
    });

    it("should persist counters in localStorage", () => {
      const { result } = renderHook(() => useCounterStore());
      act(() => {
        result.current.incrementCustomerId();
        result.current.incrementCustomerId();
      });

      const stored = localStorage.getItem("id-counters-storage");
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!).state.customerIdCounter).toBeGreaterThan(1);
    });

    it("should sync with database max IDs", () => {
      const { result } = renderHook(() => useCounterStore());
      act(() => {
        result.current.syncWithDatabase({ customerId: 100, petId: 50 });
      });

      expect(result.current.customerIdCounter).toBeGreaterThan(100);
      expect(result.current.petIdCounter).toBeGreaterThan(50);
    });
  });

  describe("useCustomerStore", () => {
    it("should add customer", () => {
      const { result } = renderHook(() => useCustomerStore());
      let customerId: number;

      act(() => {
        const customer = result.current.addCustomer({
          name: "Test Customer",
          phone: "0812345678",
        });
        customerId = customer.id;
      });

      expect(result.current.customers).toHaveLength(1);
      expect(result.current.customers[0].name).toBe("Test Customer");
      expect(customerId!).toBeGreaterThan(0);
    });

    it("should add pet to customer", () => {
      const { result } = renderHook(() => useCustomerStore());
      let customerId: number;

      act(() => {
        const customer = result.current.addCustomer({
          name: "Test Customer",
          phone: "0812345678",
        });
        customerId = customer.id;

        result.current.addPet(customerId, {
          name: "Fluffy",
          type: "DOG",
          breed: "Labrador",
          isMixedBreed: false,
          weight: null,
        });
      });

      expect(result.current.customers[0].pets).toHaveLength(1);
      expect(result.current.customers[0].pets[0].name).toBe("Fluffy");
    });

    it("should search customers", () => {
      const { result } = renderHook(() => useCustomerStore());

      act(() => {
        result.current.addCustomer({ name: "Alice", phone: "0810000001" });
        result.current.addCustomer({ name: "Bob", phone: "0820000002" });
        result.current.addCustomer({ name: "Charlie", phone: "0830000003" });
      });

      let searchResults: ReturnType<typeof result.current.searchCustomers>;
      act(() => {
        searchResults = result.current.searchCustomers("Ali");
      });

      expect(searchResults!).toHaveLength(1);
      expect(searchResults![0].name).toBe("Alice");
    });
  });

  describe("useServiceStore", () => {
    it("should add service", () => {
      const { result } = renderHook(() => useServiceStore());

      act(() => {
        result.current.addService({
          name: "Bath",
          isSpecial: false,
          order: 1,
          prices: [],
        });
      });

      expect(result.current.services).toHaveLength(1);
      expect(result.current.services[0].name).toBe("Bath");
      expect(result.current.services[0].active).toBe(true);
    });

    it("should toggle service status", () => {
      const { result } = renderHook(() => useServiceStore());
      let serviceId: number;

      act(() => {
        const service = result.current.addService({
          name: "Bath",
          isSpecial: false,
          order: 1,
          prices: [],
        });
        serviceId = service.id;
      });

      act(() => {
        result.current.toggleServiceStatus(serviceId!);
      });

      expect(result.current.services[0].active).toBe(false);
    });
  });

  describe("useBookingStore", () => {
    it("should add booking", () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.addBooking({
          customerId: 1,
          bookingDate: new Date(),
          bookingTime: "10:00",
          depositAmount: 0,
          depositStatus: "NONE",
          status: "CONFIRMED",
        });
      });

      expect(result.current.bookings).toHaveLength(1);
      expect(result.current.bookings[0].customerId).toBe(1);
    });

    it("should get booking by ID", () => {
      const { result } = renderHook(() => useBookingStore());
      let bookingId: number;

      act(() => {
        const booking = result.current.addBooking({
          customerId: 1,
          bookingDate: new Date(),
          bookingTime: "10:00",
          depositAmount: 0,
          depositStatus: "NONE",
          status: "CONFIRMED",
        });
        bookingId = booking.id;
      });

      let found: ReturnType<typeof result.current.getBookingById>;
      act(() => {
        found = result.current.getBookingById(bookingId!);
      });

      expect(found?.id).toBe(bookingId!);
    });
  });
});
