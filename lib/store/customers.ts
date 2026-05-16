import { create } from "zustand";
import type { Customer, Pet } from "@/lib/types";
import { useCounterStore } from "./counter";

// ============================================================================
// CUSTOMER STORE
// ============================================================================

interface CustomerStore {
  customers: Customer[];
  addCustomer: (
    customer: Omit<Customer, "id" | "createdAt" | "updatedAt" | "pets">,
  ) => Customer;
  updateCustomer: (id: number, data: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;
  addPet: (
    customerId: number,
    pet: Omit<Pet, "id" | "customerId" | "createdAt" | "updatedAt">,
  ) => Pet;
  updatePet: (customerId: number, petId: number, data: Partial<Pet>) => void;
  deletePet: (customerId: number, petId: number) => void;
  searchCustomers: (query: string) => Customer[];
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],

  addCustomer: (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: useCounterStore.getState().incrementCustomerId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      pets: [],
    };
    set((state) => ({ customers: [...state.customers, newCustomer] }));
    return newCustomer;
  },

  updateCustomer: (id, data) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date() } : c,
      ),
    }));
  },

  deleteCustomer: (id) => {
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }));
  },

  addPet: (customerId, petData) => {
    const newPet: Pet = {
      ...petData,
      id: useCounterStore.getState().incrementPetId(),
      customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, pets: [...c.pets, newPet], updatedAt: new Date() }
          : c,
      ),
    }));
    return newPet;
  },

  updatePet: (customerId, petId, data) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              pets: c.pets.map((p) =>
                p.id === petId ? { ...p, ...data, updatedAt: new Date() } : p,
              ),
              updatedAt: new Date(),
            }
          : c,
      ),
    }));
  },

  deletePet: (customerId, petId) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              pets: c.pets.filter((p) => p.id !== petId),
              updatedAt: new Date(),
            }
          : c,
      ),
    }));
  },

  searchCustomers: (query) => {
    const { customers } = get();
    if (!query.trim()) return customers;

    const lowerQuery = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(query) ||
        c.pets.some((p) => p.name.toLowerCase().includes(lowerQuery)),
    );
  },
}));
