import { create } from "zustand";
import type { PetTypeConfig, SizeConfig } from "@/lib/types";

// Service Configuration Store (Pet Types & Sizes)
interface ServiceConfigStore {
  petTypes: PetTypeConfig[];
  sizes: SizeConfig[];
  loading: boolean;
  error: string | null;
  fetchPetTypes: () => Promise<void>;
  fetchSizes: (petTypeId?: string) => Promise<void>;
  addPetType: (petType: Omit<PetTypeConfig, "order" | "active">) => void;
  updatePetType: (id: string, data: Partial<PetTypeConfig>) => void;
  deletePetType: (id: string) => void;
  togglePetTypeStatus: (id: string) => void;
  reorderPetTypes: (petTypes: PetTypeConfig[]) => void;
  getSizesForPetType: (petTypeId: string) => SizeConfig[];
  addSize: (size: Omit<SizeConfig, "order" | "active">) => void;
  updateSize: (id: string, data: Partial<SizeConfig>) => void;
  deleteSize: (id: string) => void;
  toggleSizeStatus: (id: string) => void;
  reorderSizes: (sizes: SizeConfig[]) => void;
}

export const useServiceConfigStore = create<ServiceConfigStore>((set, get) => ({
  petTypes: [],
  sizes: [],
  loading: false,
  error: null,

  fetchPetTypes: async () => {
    try {
      set({ loading: true, error: null });

      const response = await fetch("/api/config/pet-types");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch pet types");
      }

      const data = await response.json();
      const formattedData = (data.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        active: item.active,
        order: item.order_index,
      }));

      set({ petTypes: formattedData, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      // Fallback to default values on error
    }
  },

  fetchSizes: async (petTypeId?: string) => {
    try {
      set({ loading: true, error: null });

      const url = petTypeId
        ? `/api/config/pet-sizes?petTypeId=${petTypeId}`
        : "/api/config/pet-sizes";

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch pet sizes");
      }

      const data = await response.json();
      const formattedData = (data.data || []).map((item: any) => ({
        id: item.id,
        petTypeId: item.pet_type_id,
        name: item.name,
        minWeight: item.min_weight,
        maxWeight: item.max_weight,
        description: item.description,
        active: item.active,
        order: item.order_index,
      }));

      set({ sizes: formattedData, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      // Fallback to default values on error
    }
  },

  addPetType: (petTypeData) => {
    const maxOrder = Math.max(...get().petTypes.map((p) => p.order), 0);
    set((state) => ({
      petTypes: [
        ...state.petTypes,
        { ...petTypeData, order: maxOrder + 1, active: true },
      ],
    }));
  },

  updatePetType: (id, data) => {
    set((state) => ({
      petTypes: state.petTypes.map((p) =>
        p.id === id ? { ...p, ...data } : p,
      ),
    }));
  },

  deletePetType: (id) => {
    set((state) => ({
      petTypes: state.petTypes.filter((p) => p.id !== id),
      sizes: state.sizes.filter((s) => s.petTypeId !== id), // ลบ sizes ของประเภทนี้ด้วย
    }));
  },

  togglePetTypeStatus: (id) => {
    set((state) => ({
      petTypes: state.petTypes.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p,
      ),
    }));
  },

  reorderPetTypes: (petTypes) => {
    set({ petTypes });
  },

  getSizesForPetType: (petTypeId) => {
    return get()
      .sizes.filter((s) => s.petTypeId === petTypeId)
      .sort((a, b) => a.order - b.order);
  },

  addSize: (sizeData) => {
    const sizesForType = get().sizes.filter(
      (s) => s.petTypeId === sizeData.petTypeId,
    );
    const maxOrder =
      sizesForType.length > 0
        ? Math.max(...sizesForType.map((s) => s.order))
        : 0;
    set((state) => ({
      sizes: [
        ...state.sizes,
        { ...sizeData, order: maxOrder + 1, active: true },
      ],
    }));
  },

  updateSize: (id, data) => {
    set((state) => ({
      sizes: state.sizes.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
  },

  deleteSize: (id) => {
    set((state) => ({
      sizes: state.sizes.filter((s) => s.id !== id),
    }));
  },

  toggleSizeStatus: (id) => {
    set((state) => ({
      sizes: state.sizes.map((s) =>
        s.id === id ? { ...s, active: !s.active } : s,
      ),
    }));
  },

  reorderSizes: (sizes) => {
    set({ sizes });
  },
}));
