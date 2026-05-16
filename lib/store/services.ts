import { create } from "zustand";
import type { Service } from "@/lib/types";
import { useCounterStore } from "./counter";

// ============================================================================
// SERVICE STORE
// ============================================================================

interface ServiceStore {
  services: Service[];
  addService: (
    service: Omit<Service, "id" | "createdAt" | "updatedAt" | "active">,
  ) => Service;
  updateService: (id: number, data: Partial<Service>) => void;
  deleteService: (id: number) => void;
  toggleServiceStatus: (id: number) => void;
}

export const useServiceStore = create<ServiceStore>((set) => ({
  services: [],

  addService: (serviceData) => {
    const newService: Service = {
      ...serviceData,
      id: useCounterStore.getState().incrementServiceId(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ services: [...state.services, newService] }));
    return newService;
  },

  updateService: (id, data) => {
    set((state) => ({
      services: state.services.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date() } : s,
      ),
    }));
  },

  deleteService: (id) => {
    set((state) => ({
      services: state.services.filter((s) => s.id !== id),
    }));
  },

  toggleServiceStatus: (id) => {
    set((state) => ({
      services: state.services.map((s) =>
        s.id === id ? { ...s, active: !s.active, updatedAt: new Date() } : s,
      ),
    }));
  },
}));
