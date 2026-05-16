import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCounterStore } from "@/lib/store/counter";

beforeEach(() => {
  localStorage.clear();
  useCounterStore.setState({
    customerIdCounter: 1,
    petIdCounter: 1,
    serviceIdCounter: 1,
    promotionIdCounter: 1,
    bookingIdCounter: 1,
  });
});

describe("useCounterStore", () => {
  describe("syncWithDatabase", () => {
    it("uses MAX(local, dbValue+1) — does not simply replace", () => {
      const { result } = renderHook(() => useCounterStore());

      // local is 1, db says 5 → should become 6
      act(() => {
        result.current.syncWithDatabase({ customerId: 5 });
      });

      expect(result.current.customerIdCounter).toBe(6);
    });

    it("does not decrease counters when DB value is lower than local", () => {
      const { result } = renderHook(() => useCounterStore());

      // Bump local to 10
      act(() => {
        for (let i = 0; i < 9; i++) {
          result.current.incrementCustomerId();
        }
      });
      expect(result.current.customerIdCounter).toBe(10);

      // DB says max id is 3 → local (10) > db+1 (4), so counter stays 10
      act(() => {
        result.current.syncWithDatabase({ customerId: 3 });
      });

      expect(result.current.customerIdCounter).toBe(10);
    });

    it("handles partial IDs — only provided fields are synced upward", () => {
      const { result } = renderHook(() => useCounterStore());

      // Only provide petId
      act(() => {
        result.current.syncWithDatabase({ petId: 20 });
      });

      // petId should be bumped to 21
      expect(result.current.petIdCounter).toBe(21);

      // customerIdCounter was not provided → stays at 1 (MAX(1, 0+1) = 1)
      expect(result.current.customerIdCounter).toBe(1);

      // others stay at 1 too
      expect(result.current.serviceIdCounter).toBe(1);
      expect(result.current.promotionIdCounter).toBe(1);
      expect(result.current.bookingIdCounter).toBe(1);
    });

    it("handles all fields at once", () => {
      const { result } = renderHook(() => useCounterStore());

      act(() => {
        result.current.syncWithDatabase({
          customerId: 10,
          petId: 20,
          serviceId: 30,
          promotionId: 40,
          bookingId: 50,
        });
      });

      expect(result.current.customerIdCounter).toBe(11);
      expect(result.current.petIdCounter).toBe(21);
      expect(result.current.serviceIdCounter).toBe(31);
      expect(result.current.promotionIdCounter).toBe(41);
      expect(result.current.bookingIdCounter).toBe(51);
    });

    it("with no args provided sets counters to MAX(local, 0+1) = local when local >= 1", () => {
      const { result } = renderHook(() => useCounterStore());

      // All undefined → each becomes MAX(1, 0+1) = 1
      act(() => {
        result.current.syncWithDatabase({});
      });

      expect(result.current.customerIdCounter).toBe(1);
      expect(result.current.petIdCounter).toBe(1);
    });
  });

  describe("sequential increments", () => {
    it("returns unique IDs on multiple sequential increments", () => {
      const { result } = renderHook(() => useCounterStore());

      const ids: number[] = [];
      act(() => {
        for (let i = 0; i < 5; i++) {
          ids.push(result.current.incrementCustomerId());
        }
      });

      const unique = new Set(ids);
      expect(unique.size).toBe(5);
    });

    it("IDs are strictly increasing", () => {
      const { result } = renderHook(() => useCounterStore());

      const ids: number[] = [];
      act(() => {
        for (let i = 0; i < 5; i++) {
          ids.push(result.current.incrementPetId());
        }
      });

      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThan(ids[i - 1]);
      }
    });

    it("different counter types do not interfere", () => {
      const { result } = renderHook(() => useCounterStore());

      let custId: number;
      let petId: number;
      act(() => {
        custId = result.current.incrementCustomerId();
        petId = result.current.incrementPetId();
      });

      // Both start at 1
      expect(custId!).toBe(1);
      expect(petId!).toBe(1);

      // After increment, each counter advanced independently
      expect(result.current.customerIdCounter).toBe(2);
      expect(result.current.petIdCounter).toBe(2);
    });
  });
});
