import { create } from "zustand";
import type { Promotion } from "@/lib/types";
import { useCounterStore } from "./counter";

// ============================================================================
// PROMOTION STORE
// ============================================================================

interface PromotionStore {
  promotions: Promotion[];
  addPromotion: (promotion: Omit<Promotion, "id" | "createdAt">) => Promotion;
  updatePromotion: (id: number, data: Partial<Promotion>) => void;
  deletePromotion: (id: number) => void;
  togglePromotion: (id: number) => void;
}

export const usePromotionStore = create<PromotionStore>((set) => ({
  promotions: [],

  addPromotion: (promotionData) => {
    const newPromotion: Promotion = {
      ...promotionData,
      id: useCounterStore.getState().incrementPromotionId(),
      createdAt: new Date(),
    };
    set((state) => ({ promotions: [...state.promotions, newPromotion] }));
    return newPromotion;
  },

  updatePromotion: (id, data) => {
    set((state) => ({
      promotions: state.promotions.map((p) =>
        p.id === id ? { ...p, ...data } : p,
      ),
    }));
  },

  deletePromotion: (id) => {
    set((state) => ({
      promotions: state.promotions.filter((p) => p.id !== id),
    }));
  },

  togglePromotion: (id) => {
    set((state) => ({
      promotions: state.promotions.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p,
      ),
    }));
  },
}));
