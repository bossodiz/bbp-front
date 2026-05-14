"use client";

import { create } from "zustand";

// ============================================================================
// LOADING STATE MANAGEMENT - Track loading states globally
// ============================================================================

interface LoadingState {
  // Product operations
  productsLoading: boolean;
  productCreating: boolean;
  productUpdating: Set<number>;
  productDeleting: Set<number>;

  // Sales operations
  salesLoading: boolean;
  saleCreating: boolean;
  saleUpdating: Set<number>;

  // Customer operations
  customersLoading: boolean;
  customerCreating: boolean;
  customerUpdating: Set<number>;

  // Booking operations
  bookingsLoading: boolean;
  bookingCreating: boolean;
  bookingUpdating: Set<number>;

  // Actions
  setProductsLoading: (loading: boolean) => void;
  setProductCreating: (creating: boolean) => void;
  setProductUpdating: (id: number, updating: boolean) => void;
  setProductDeleting: (id: number, deleting: boolean) => void;

  setSalesLoading: (loading: boolean) => void;
  setSaleCreating: (creating: boolean) => void;
  setSaleUpdating: (id: number, updating: boolean) => void;

  setCustomersLoading: (loading: boolean) => void;
  setCustomerCreating: (creating: boolean) => void;
  setCustomerUpdating: (id: number, updating: boolean) => void;

  setBookingsLoading: (loading: boolean) => void;
  setBookingCreating: (creating: boolean) => void;
  setBookingUpdating: (id: number, updating: boolean) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  productsLoading: false,
  productCreating: false,
  productUpdating: new Set(),
  productDeleting: new Set(),

  salesLoading: false,
  saleCreating: false,
  saleUpdating: new Set(),

  customersLoading: false,
  customerCreating: false,
  customerUpdating: new Set(),

  bookingsLoading: false,
  bookingCreating: false,
  bookingUpdating: new Set(),

  // Products
  setProductsLoading: (loading) => set({ productsLoading: loading }),
  setProductCreating: (creating) => set({ productCreating: creating }),
  setProductUpdating: (id, updating) =>
    set((state) => {
      const updated = new Set(state.productUpdating);
      if (updating) updated.add(id);
      else updated.delete(id);
      return { productUpdating: updated };
    }),
  setProductDeleting: (id, deleting) =>
    set((state) => {
      const deleted = new Set(state.productDeleting);
      if (deleting) deleted.add(id);
      else deleted.delete(id);
      return { productDeleting: deleted };
    }),

  // Sales
  setSalesLoading: (loading) => set({ salesLoading: loading }),
  setSaleCreating: (creating) => set({ saleCreating: creating }),
  setSaleUpdating: (id, updating) =>
    set((state) => {
      const updated = new Set(state.saleUpdating);
      if (updating) updated.add(id);
      else updated.delete(id);
      return { saleUpdating: updated };
    }),

  // Customers
  setCustomersLoading: (loading) => set({ customersLoading: loading }),
  setCustomerCreating: (creating) => set({ customerCreating: creating }),
  setCustomerUpdating: (id, updating) =>
    set((state) => {
      const updated = new Set(state.customerUpdating);
      if (updating) updated.add(id);
      else updated.delete(id);
      return { customerUpdating: updated };
    }),

  // Bookings
  setBookingsLoading: (loading) => set({ bookingsLoading: loading }),
  setBookingCreating: (creating) => set({ bookingCreating: creating }),
  setBookingUpdating: (id, updating) =>
    set((state) => {
      const updated = new Set(state.bookingUpdating);
      if (updating) updated.add(id);
      else updated.delete(id);
      return { bookingUpdating: updated };
    }),
}));

// ============================================================================
// HELPER HOOKS
// ============================================================================

export function useProductLoading(id?: number) {
  const store = useLoadingStore();
  if (!id) {
    return {
      isLoading: store.productsLoading,
      isCreating: store.productCreating,
    };
  }
  return {
    isUpdating: store.productUpdating.has(id),
    isDeleting: store.productDeleting.has(id),
  };
}

export function useSalesLoading(id?: number) {
  const store = useLoadingStore();
  if (!id) {
    return {
      isLoading: store.salesLoading,
      isCreating: store.saleCreating,
    };
  }
  return {
    isUpdating: store.saleUpdating.has(id),
  };
}

export function useCustomerLoading(id?: number) {
  const store = useLoadingStore();
  if (!id) {
    return {
      isLoading: store.customersLoading,
      isCreating: store.customerCreating,
    };
  }
  return {
    isUpdating: store.customerUpdating.has(id),
  };
}

export function useBookingLoading(id?: number) {
  const store = useLoadingStore();
  if (!id) {
    return {
      isLoading: store.bookingsLoading,
      isCreating: store.bookingCreating,
    };
  }
  return {
    isUpdating: store.bookingUpdating.has(id),
  };
}
