import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api-client";
import { PetSize, PetType } from "../types";

export interface UseServiceConfigReturn {
  petTypes: PetType[];
  petSizes: PetSize[];
  loading: boolean;
  error: string | null;
  fetchPetTypes: () => Promise<void>;
  fetchPetSizes: () => Promise<void>;
  createPetType: (data: PetType) => Promise<void>;
  updatePetType: (id: number, data: Partial<PetType>) => Promise<void>;
  deletePetType: (id: number) => Promise<void>;
  reorderPetType: (items: { id: number; order: number }[]) => Promise<void>;
  createPetSize: (data: PetSize) => Promise<void>;
  updatePetSize: (id: number, data: Partial<PetSize>) => Promise<void>;
  deletePetSize: (id: number) => Promise<void>;
  reorderPetSize: (items: { id: number; order: number }[]) => Promise<void>;
  getSizesForPetType: (petTypeId: number) => PetSize[];
}

export function useServiceConfig({
  autoFetch = true,
}: { autoFetch?: boolean } = {}): UseServiceConfigReturn {
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [petSizes, setPetSizes] = useState<PetSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPetTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiRequest<any[]>("/master/pet-types");
      const formattedData = ((result.data as any[]) || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        key: item.key,
        order: item.order_index || item.orderIndex || 0,
        active: item.active,
      }));
      setPetTypes(formattedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPetSizes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiRequest<any[]>("/master/pet-sizes");
      const formattedData = ((result.data as any[]) || []).map((item: any) => ({
        id: item.id,
        key: item.key,
        petTypeId: item.petTypeId,
        name: item.name,
        minWeight: item.minWeight,
        maxWeight: item.maxWeight,
        description: item.description,
        active: item.active,
        order: item.order,
      }));
      setPetSizes(formattedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSizesForPetType = useCallback(
    (petTypeId: number): PetSize[] => {
      return petSizes
        .filter((size) => size.petTypeId === petTypeId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    [petSizes],
  );

  const createPetType = async (data: PetType): Promise<void> => {
    await apiRequest<any>("/master/pet-types", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        icon: data.icon,
        key: data.key,
      }),
    });
    await fetchPetTypes();
  };

  const updatePetType = async (
    id: number,
    data: Partial<PetType>,
  ): Promise<void> => {
    await apiRequest<any>(`/master/pet-types`, {
      method: "PUT",
      body: JSON.stringify({
        id,
        name: data.name,
        icon: data.icon,
        active: data.active,
      }),
    });
    await fetchPetTypes();
  };

  const deletePetType = async (id: number): Promise<void> => {
    await apiRequest(`/master/pet-type/${id}`, { method: "DELETE" });
    await fetchPetTypes();
    await fetchPetSizes();
  };

  const reorderPetType = async (
    items: { id: number; order: number }[],
  ): Promise<void> => {
    await apiRequest("/master/pet-types/reorder", {
      method: "PUT",
      body: JSON.stringify(
        items.map((i) => ({ id: i.id, order_index: i.order })),
      ),
    });
    await fetchPetTypes();
  };

  const createPetSize = async (data: PetSize): Promise<void> => {
    await apiRequest<any>("/master/pet-sizes", {
      method: "POST",
      body: JSON.stringify({
        pet_type_id: data.petTypeId,
        name: data.name,
        min_weight: data.minWeight,
        max_weight: data.maxWeight,
        description: data.description,
      }),
    });
    await fetchPetSizes();
  };

  const updatePetSize = async (
    id: number,
    data: Partial<PetSize>,
  ): Promise<void> => {
    const result = await apiRequest<any>(`/config/pet-sizes/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        id,
        name: data.name,
        min_weight: data.minWeight,
        max_weight: data.maxWeight,
        description: data.description,
        active: data.active,
        order_index: data.order,
      }),
    });
    await fetchPetSizes();
  };

  const deletePetSize = async (id: number): Promise<void> => {
    await apiRequest(`/config/pet-sizes/${id}`, { method: "DELETE" });
    await fetchPetSizes();
  };

  const reorderPetSize = async (
    items: { id: number; order: number }[],
  ): Promise<void> => {
    await apiRequest("/master/pet-sizes/reorder", {
      method: "PUT",
      body: JSON.stringify(
        items.map((i) => ({ id: i.id, order_index: i.order })),
      ),
    });
    await fetchPetSizes();
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPetTypes();
      fetchPetSizes();
    }
  }, [autoFetch, fetchPetTypes, fetchPetSizes]);

  return {
    petTypes,
    petSizes,
    loading,
    error,
    fetchPetTypes,
    fetchPetSizes,
    createPetType,
    updatePetType,
    deletePetType,
    reorderPetType,
    createPetSize,
    updatePetSize,
    deletePetSize,
    reorderPetSize,
    getSizesForPetType,
  };
}
