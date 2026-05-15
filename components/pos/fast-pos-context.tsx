"use client";

import { createContext, useContext, useState, useCallback } from "react";

// ============================================================
// Types
// ============================================================

export interface FastPOSCustomer {
  id?: number; // existing customer
  name: string;
  phone: string; // auto "0000000000" if empty
  isExisting: boolean;
}

export interface FastPOSPet {
  id?: number; // existing pet
  name: string;
  type: "DOG" | "CAT";
  breed: string;
  breedId?: number;
  weight?: number;
  selected: boolean; // for existing customer multi-select
  isExisting: boolean;
}

export interface FastPOSServiceSelection {
  petIndex: number;
  petId?: number;
  petName: string;
  petType: "DOG" | "CAT";
  serviceId: number;
  serviceName: string;
  sizeId?: string;
  price: number;
}

export interface FastPOSState {
  currentStep: 1 | 2 | 3 | 4;
  customer: FastPOSCustomer | null;
  pets: FastPOSPet[];
  selectedServices: FastPOSServiceSelection[];
  // Step 3 sub-state: which pet index we're selecting services for
  currentPetIndexForService: number;
  isLoading: boolean;
  error: string | null;
}

interface FastPOSContextValue {
  state: FastPOSState;
  // Navigation
  goToStep: (step: 1 | 2 | 3 | 4) => void;
  nextStep: () => void;
  prevStep: () => void;
  // Customer
  setCustomer: (customer: FastPOSCustomer) => void;
  // Pets
  setPets: (pets: FastPOSPet[]) => void;
  addPet: (pet: Omit<FastPOSPet, "selected" | "isExisting">) => void;
  updatePetWeight: (index: number, weight: number) => void;
  togglePetSelected: (index: number) => void;
  // Services
  setServicesForPet: (petIndex: number, services: FastPOSServiceSelection[]) => void;
  clearServicesForPet: (petIndex: number) => void;
  setCurrentPetIndexForService: (index: number) => void;
  // Misc
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ============================================================
// Default state
// ============================================================

const defaultState: FastPOSState = {
  currentStep: 1,
  customer: null,
  pets: [],
  selectedServices: [],
  currentPetIndexForService: 0,
  isLoading: false,
  error: null,
};

// ============================================================
// Context
// ============================================================

const FastPOSContext = createContext<FastPOSContextValue | null>(null);

export function FastPOSProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FastPOSState>(defaultState);

  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setState((s) => ({ ...s, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => ({
      ...s,
      currentStep: Math.min(4, s.currentStep + 1) as 1 | 2 | 3 | 4,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({
      ...s,
      currentStep: Math.max(1, s.currentStep - 1) as 1 | 2 | 3 | 4,
    }));
  }, []);

  const setCustomer = useCallback((customer: FastPOSCustomer) => {
    setState((s) => ({ ...s, customer }));
  }, []);

  const setPets = useCallback((pets: FastPOSPet[]) => {
    setState((s) => ({ ...s, pets }));
  }, []);

  const addPet = useCallback((pet: Omit<FastPOSPet, "selected" | "isExisting">) => {
    setState((s) => ({
      ...s,
      pets: [...s.pets, { ...pet, selected: true, isExisting: false }],
    }));
  }, []);

  const updatePetWeight = useCallback((index: number, weight: number) => {
    setState((s) => ({
      ...s,
      pets: s.pets.map((p, i) => (i === index ? { ...p, weight } : p)),
    }));
  }, []);

  const togglePetSelected = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      pets: s.pets.map((p, i) =>
        i === index ? { ...p, selected: !p.selected } : p,
      ),
    }));
  }, []);

  const setServicesForPet = useCallback(
    (petIndex: number, services: FastPOSServiceSelection[]) => {
      setState((s) => {
        const filtered = s.selectedServices.filter((sv) => sv.petIndex !== petIndex);
        return { ...s, selectedServices: [...filtered, ...services] };
      });
    },
    [],
  );

  const clearServicesForPet = useCallback((petIndex: number) => {
    setState((s) => ({
      ...s,
      selectedServices: s.selectedServices.filter((sv) => sv.petIndex !== petIndex),
    }));
  }, []);

  const setCurrentPetIndexForService = useCallback((index: number) => {
    setState((s) => ({ ...s, currentPetIndexForService: index }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((s) => ({ ...s, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <FastPOSContext.Provider
      value={{
        state,
        goToStep,
        nextStep,
        prevStep,
        setCustomer,
        setPets,
        addPet,
        updatePetWeight,
        togglePetSelected,
        setServicesForPet,
        clearServicesForPet,
        setCurrentPetIndexForService,
        setLoading,
        setError,
        reset,
      }}
    >
      {children}
    </FastPOSContext.Provider>
  );
}

export function useFastPOS() {
  const ctx = useContext(FastPOSContext);
  if (!ctx) throw new Error("useFastPOS must be used within FastPOSProvider");
  return ctx;
}

// Helper: get selected pets (only those with selected: true)
export function getSelectedPets(pets: FastPOSPet[]) {
  return pets.filter((p) => p.selected);
}

// Helper: estimate size from weight using sizes config
export function estimateSizeId(
  weight: number | undefined,
  sizes: Array<{ id: string; minWeight?: number; maxWeight?: number }>,
): string | null {
  if (!weight || sizes.length === 0) return null;
  const sorted = [...sizes].sort((a, b) => (a.minWeight ?? 0) - (b.minWeight ?? 0));
  for (const size of sorted) {
    const min = size.minWeight ?? 0;
    const max = size.maxWeight ?? Infinity;
    if (weight >= min && weight < max) return size.id;
  }
  return sorted[sorted.length - 1]?.id ?? null;
}
