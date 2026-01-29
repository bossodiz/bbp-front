"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useServiceConfig } from "@/lib/hooks/use-service-config";
import type { PetType, PetSize } from "@/lib/hooks/use-service-config";

interface ServiceConfigContextType {
  petTypes: PetType[];
  petSizes: PetSize[];
  loading: boolean;
  error: string | null;
  fetchPetTypes: () => Promise<void>;
  fetchPetSizes: (petTypeId?: string) => Promise<void>;
  createPetType: (data: Omit<PetType, "order">) => Promise<PetType>;
  updatePetType: (id: string, data: Partial<PetType>) => Promise<PetType>;
  deletePetType: (id: string) => Promise<void>;
  createSize: (data: Omit<PetSize, "order">) => Promise<PetSize>;
  updateSize: (id: string, data: Partial<PetSize>) => Promise<PetSize>;
  deleteSize: (id: string) => Promise<void>;
  getSizesForPetType: (petTypeId: string) => PetSize[];
}

const ServiceConfigContext = createContext<
  ServiceConfigContextType | undefined
>(undefined);

export function ServiceConfigProvider({ children }: { children: ReactNode }) {
  const serviceConfig = useServiceConfig();

  return (
    <ServiceConfigContext.Provider value={serviceConfig}>
      {children}
    </ServiceConfigContext.Provider>
  );
}

export function useServiceConfigContext() {
  const context = useContext(ServiceConfigContext);
  if (context === undefined) {
    throw new Error(
      "useServiceConfigContext must be used within a ServiceConfigProvider",
    );
  }
  return context;
}
