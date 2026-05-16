import { create } from "zustand";

// POS Store
export interface CartItem {
  id: string;
  serviceId: number;
  serviceName: string;
  originalPrice: number;
  finalPrice: number;
  isPriceModified: boolean;
  itemType?: "SERVICE" | "PRODUCT";
  productId?: number | null;
  quantity?: number;
  maxQuantity?: number | null;
  petId: number | null;
  petName?: string;
  petType?: "DOG" | "CAT";
}

interface POSStore {
  cart: CartItem[];
  selectedCustomerId: number | null;
  selectedPetIds: number[];
  selectedBookingId: number | null;
  selectedHotelBookingId: number | null;
  appliedPromotionId: number | null;
  _cartCounter: number;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateCartItemPrice: (id: string, price: number) => void;
  incrementCartItemQuantity: (id: string) => void;
  decrementCartItemQuantity: (id: string) => void;
  clearCart: () => void;
  setSelectedCustomer: (customerId: number | null) => void;
  togglePetSelection: (petId: number) => void;
  setSelectedBooking: (bookingId: number | null) => void;
  setAppliedPromotion: (promotionId: number | null) => void;
  setHotelBooking: (
    customerId: number | null,
    hotelBookingId: number | null,
  ) => void;
  resetPOS: () => void;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  cart: [],
  selectedCustomerId: null,
  selectedPetIds: [],
  selectedBookingId: null,
  selectedHotelBookingId: null,
  appliedPromotionId: null,
  _cartCounter: 0,

  addToCart: (item) => {
    set((state) => {
      const itemType = item.itemType || "SERVICE";
      const qty = item.quantity ?? 1;

      if (itemType === "PRODUCT" && item.productId) {
        const existingIndex = state.cart.findIndex(
          (c) =>
            (c.itemType || "SERVICE") === "PRODUCT" &&
            c.productId === item.productId,
        );

        if (existingIndex >= 0) {
          const existing = state.cart[existingIndex];
          const existingQty = existing.quantity ?? 1;
          const maxQty = existing.maxQuantity ?? item.maxQuantity ?? null;
          const nextQty = maxQty
            ? Math.min(existingQty + qty, maxQty)
            : existingQty + qty;

          return {
            cart: state.cart.map((c, idx) =>
              idx === existingIndex
                ? {
                    ...c,
                    quantity: nextQty,
                    maxQuantity: maxQty,
                  }
                : c,
            ),
          };
        }
      }

      return {
        cart: [
          ...state.cart,
          {
            ...item,
            itemType,
            productId: item.productId ?? null,
            quantity: qty,
            maxQuantity: item.maxQuantity ?? null,
            id: `cart-${state._cartCounter}-${item.serviceId}`,
          },
        ],
        _cartCounter: state._cartCounter + 1,
      };
    });
  },

  removeFromCart: (id) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    }));
  },

  updateCartItemPrice: (id, price) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === id
          ? {
              ...item,
              finalPrice: price,
              isPriceModified: price !== item.originalPrice,
            }
          : item,
      ),
    }));
  },

  incrementCartItemQuantity: (id) => {
    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.id !== id) return item;
        const qty = item.quantity ?? 1;
        const maxQty = item.maxQuantity ?? null;
        if (maxQty && qty >= maxQty) return item;
        return { ...item, quantity: qty + 1 };
      }),
    }));
  },

  decrementCartItemQuantity: (id) => {
    set((state) => {
      const target = state.cart.find((c) => c.id === id);
      if (!target) return { cart: state.cart };
      const qty = target.quantity ?? 1;

      if (qty <= 1) {
        return { cart: state.cart.filter((c) => c.id !== id) };
      }

      return {
        cart: state.cart.map((item) =>
          item.id === id
            ? { ...item, quantity: (item.quantity ?? 1) - 1 }
            : item,
        ),
      };
    });
  },

  clearCart: () => {
    set({ cart: [] });
  },

  setSelectedCustomer: (customerId) => {
    set({ selectedCustomerId: customerId, selectedPetIds: [] });
  },

  togglePetSelection: (petId) => {
    set((state) => {
      const isSelected = state.selectedPetIds.includes(petId);
      return {
        selectedPetIds: isSelected
          ? state.selectedPetIds.filter((id) => id !== petId)
          : [...state.selectedPetIds, petId],
      };
    });
  },

  setSelectedBooking: (bookingId) => {
    set({ selectedBookingId: bookingId });
  },

  setAppliedPromotion: (promotionId) => {
    set({ appliedPromotionId: promotionId });
  },

  setHotelBooking: (customerId, hotelBookingId) => {
    const s = get();
    if (
      s.cart.length === 0 &&
      s.selectedCustomerId === customerId &&
      s.selectedPetIds.length === 0 &&
      s.selectedBookingId === null &&
      s.selectedHotelBookingId === hotelBookingId &&
      s.appliedPromotionId === null
    )
      return;
    set({
      cart: [],
      selectedCustomerId: customerId,
      selectedPetIds: [],
      selectedBookingId: null,
      selectedHotelBookingId: hotelBookingId,
      appliedPromotionId: null,
    });
  },

  resetPOS: () => {
    const s = get();
    if (
      s.cart.length === 0 &&
      s.selectedCustomerId === null &&
      s.selectedPetIds.length === 0 &&
      s.selectedBookingId === null &&
      s.selectedHotelBookingId === null &&
      s.appliedPromotionId === null
    )
      return;
    set({
      cart: [],
      selectedCustomerId: null,
      selectedPetIds: [],
      selectedBookingId: null,
      selectedHotelBookingId: null,
      appliedPromotionId: null,
    });
  },
}));
