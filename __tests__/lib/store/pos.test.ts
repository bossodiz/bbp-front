import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePOSStore } from "@/lib/store/pos";
import type { CartItem } from "@/lib/store/pos";

/** Minimal valid CartItem payload (without id) */
const makeServiceItem = (
  overrides: Partial<Omit<CartItem, "id">> = {},
): Omit<CartItem, "id"> => ({
  serviceId: 1,
  serviceName: "Bath",
  originalPrice: 200,
  finalPrice: 200,
  isPriceModified: false,
  itemType: "SERVICE",
  petId: null,
  ...overrides,
});

beforeEach(() => {
  usePOSStore.setState({
    cart: [],
    selectedCustomerId: null,
    selectedPetIds: [],
    selectedBookingId: null,
    selectedHotelBookingId: null,
    appliedPromotionId: null,
    _cartCounter: 0,
  });
});

describe("usePOSStore", () => {
  describe("addToCart", () => {
    it("creates a cart item with a unique string ID", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem());
      });

      expect(result.current.cart).toHaveLength(1);
      expect(typeof result.current.cart[0].id).toBe("string");
      expect(result.current.cart[0].id.length).toBeGreaterThan(0);
    });

    it("adds SERVICE items as separate cart entries on each call", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem({ serviceId: 1 }));
        result.current.addToCart(makeServiceItem({ serviceId: 1 }));
      });

      // SERVICE type never merges
      expect(result.current.cart).toHaveLength(2);
      const ids = result.current.cart.map((c) => c.id);
      expect(new Set(ids).size).toBe(2);
    });

    it("merges PRODUCT items with the same productId", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(
          makeServiceItem({ itemType: "PRODUCT", productId: 99, quantity: 1 }),
        );
        result.current.addToCart(
          makeServiceItem({ itemType: "PRODUCT", productId: 99, quantity: 2 }),
        );
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(3);
    });
  });

  describe("removeFromCart", () => {
    it("removes only the item with the matching ID", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem({ serviceId: 1 }));
        result.current.addToCart(makeServiceItem({ serviceId: 2 }));
      });

      const idToRemove = result.current.cart[0].id;
      const idToKeep = result.current.cart[1].id;

      act(() => {
        result.current.removeFromCart(idToRemove);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].id).toBe(idToKeep);
    });
  });

  describe("updateCartItemPrice", () => {
    it("changes finalPrice and sets isPriceModified to true", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem({ originalPrice: 300, finalPrice: 300 }));
      });

      const id = result.current.cart[0].id;

      act(() => {
        result.current.updateCartItemPrice(id, 250);
      });

      expect(result.current.cart[0].finalPrice).toBe(250);
      expect(result.current.cart[0].isPriceModified).toBe(true);
    });

    it("sets isPriceModified to false when price equals originalPrice", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem({ originalPrice: 300, finalPrice: 300 }));
      });

      const id = result.current.cart[0].id;

      // First modify, then restore
      act(() => {
        result.current.updateCartItemPrice(id, 250);
      });
      act(() => {
        result.current.updateCartItemPrice(id, 300);
      });

      expect(result.current.cart[0].isPriceModified).toBe(false);
    });
  });

  describe("incrementCartItemQuantity", () => {
    it("increases quantity by 1", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem({ quantity: 2 }));
      });

      const id = result.current.cart[0].id;

      act(() => {
        result.current.incrementCartItemQuantity(id);
      });

      expect(result.current.cart[0].quantity).toBe(3);
    });

    it("does not exceed maxQuantity", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(
          makeServiceItem({ quantity: 5, maxQuantity: 5 }),
        );
      });

      const id = result.current.cart[0].id;

      act(() => {
        result.current.incrementCartItemQuantity(id);
      });

      expect(result.current.cart[0].quantity).toBe(5);
    });
  });

  describe("decrementCartItemQuantity", () => {
    it("decreases quantity by 1", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem({ quantity: 3 }));
      });

      const id = result.current.cart[0].id;

      act(() => {
        result.current.decrementCartItemQuantity(id);
      });

      expect(result.current.cart[0].quantity).toBe(2);
    });

    it("removes the item when quantity would go to 0", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem({ quantity: 1 }));
      });

      const id = result.current.cart[0].id;

      act(() => {
        result.current.decrementCartItemQuantity(id);
      });

      expect(result.current.cart).toHaveLength(0);
    });
  });

  describe("setSelectedCustomer", () => {
    it("updates selectedCustomerId", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.setSelectedCustomer(42);
      });

      expect(result.current.selectedCustomerId).toBe(42);
    });

    it("clears selectedPetIds when customer changes", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.togglePetSelection(7);
        result.current.setSelectedCustomer(42);
      });

      expect(result.current.selectedPetIds).toHaveLength(0);
    });
  });

  describe("clearCart", () => {
    it("empties the cart", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem());
        result.current.addToCart(makeServiceItem({ serviceId: 2 }));
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it("keeps selectedCustomerId after clearing cart", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.setSelectedCustomer(55);
        result.current.addToCart(makeServiceItem());
        result.current.clearCart();
      });

      expect(result.current.selectedCustomerId).toBe(55);
    });
  });

  describe("resetPOS", () => {
    it("resets everything to initial state", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.setSelectedCustomer(10);
        result.current.addToCart(makeServiceItem());
        result.current.setAppliedPromotion(5);
        result.current.resetPOS();
      });

      expect(result.current.cart).toHaveLength(0);
      expect(result.current.selectedCustomerId).toBeNull();
      expect(result.current.selectedPetIds).toHaveLength(0);
      expect(result.current.selectedBookingId).toBeNull();
      expect(result.current.selectedHotelBookingId).toBeNull();
      expect(result.current.appliedPromotionId).toBeNull();
    });
  });

  describe("setHotelBooking", () => {
    it("sets selectedCustomerId and selectedHotelBookingId", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.setSelectedCustomer(1); // make state dirty so guard passes
        result.current.setHotelBooking(7, 99);
      });

      expect(result.current.selectedCustomerId).toBe(7);
      expect(result.current.selectedHotelBookingId).toBe(99);
    });

    it("clears cart and resets booking fields", () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.addToCart(makeServiceItem());
        result.current.setSelectedBooking(11);
        result.current.setHotelBooking(3, 88);
      });

      expect(result.current.cart).toHaveLength(0);
      expect(result.current.selectedBookingId).toBeNull();
      expect(result.current.appliedPromotionId).toBeNull();
    });
  });
});
