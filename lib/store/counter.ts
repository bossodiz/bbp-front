import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// ID COUNTER PERSISTENCE - เก็บ counters ใน localStorage
// ============================================================================

interface CounterState {
  customerIdCounter: number;
  petIdCounter: number;
  serviceIdCounter: number;
  promotionIdCounter: number;
  bookingIdCounter: number;
  incrementCustomerId: () => number;
  incrementPetId: () => number;
  incrementServiceId: () => number;
  incrementPromotionId: () => number;
  incrementBookingId: () => number;
  syncWithDatabase: (maxIds: {
    customerId?: number;
    petId?: number;
    serviceId?: number;
    promotionId?: number;
    bookingId?: number;
  }) => void;
}

export const useCounterStore = create<CounterState>()(
  persist(
    (set, get) => ({
      customerIdCounter: 1,
      petIdCounter: 1,
      serviceIdCounter: 1,
      promotionIdCounter: 1,
      bookingIdCounter: 1,

      incrementCustomerId: () => {
        const current = get().customerIdCounter;
        set({ customerIdCounter: current + 1 });
        return current;
      },

      incrementPetId: () => {
        const current = get().petIdCounter;
        set({ petIdCounter: current + 1 });
        return current;
      },

      incrementServiceId: () => {
        const current = get().serviceIdCounter;
        set({ serviceIdCounter: current + 1 });
        return current;
      },

      incrementPromotionId: () => {
        const current = get().promotionIdCounter;
        set({ promotionIdCounter: current + 1 });
        return current;
      },

      incrementBookingId: () => {
        const current = get().bookingIdCounter;
        set({ bookingIdCounter: current + 1 });
        return current;
      },

      syncWithDatabase: (maxIds) => {
        set((state) => ({
          customerIdCounter: Math.max(state.customerIdCounter, (maxIds.customerId ?? 0) + 1),
          petIdCounter: Math.max(state.petIdCounter, (maxIds.petId ?? 0) + 1),
          serviceIdCounter: Math.max(state.serviceIdCounter, (maxIds.serviceId ?? 0) + 1),
          promotionIdCounter: Math.max(state.promotionIdCounter, (maxIds.promotionId ?? 0) + 1),
          bookingIdCounter: Math.max(state.bookingIdCounter, (maxIds.bookingId ?? 0) + 1),
        }));
      },
    }),
    {
      name: "id-counters-storage",
    },
  ),
);
