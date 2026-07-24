import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiSend } from "@/lib/api";

export interface PetType {
  id: string;
  name: string;
  icon?: string;
  active: boolean;
  order: number;
}

export interface PetSize {
  id: string;
  petTypeId: string;
  name: string;
  minWeight?: number;
  maxWeight?: number;
  description?: string;
  active: boolean;
  order: number;
}

interface UseServiceConfigReturn {
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

export function useServiceConfig(): UseServiceConfigReturn {
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [petSizes, setPetSizes] = useState<PetSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPetTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const rows = await apiFetch<any[]>("/api/config/pet-types");
      const formattedData = (rows ?? []).map((item: { id: string; name: string; icon?: string; active: boolean; order_index: number }) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        active: item.active,
        order: item.order_index,
      }));
      setPetTypes(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPetSizes = useCallback(async (petTypeId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = petTypeId
        ? `/api/config/pet-sizes?petTypeId=${petTypeId}`
        : "/api/config/pet-sizes";

      const rows = await apiFetch<any[]>(url);
      const formattedData = (rows ?? []).map((item: { id: string; pet_type_id: string; name: string; min_weight?: number; max_weight?: number; description?: string; active: boolean; order_index: number }) => ({
        id: item.id,
        petTypeId: item.pet_type_id,
        name: item.name,
        minWeight: item.min_weight,
        maxWeight: item.max_weight,
        description: item.description,
        active: item.active,
        order: item.order_index,
      }));
      setPetSizes(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const getSizesForPetType = useCallback(
    (petTypeId: string): PetSize[] => {
      return petSizes
        .filter((size) => size.petTypeId === petTypeId)
        .sort((a, b) => a.order - b.order);
    },
    [petSizes],
  );

  const createPetType = async (
    data: Omit<PetType, "order">,
  ): Promise<PetType> => {
    const maxOrder = Math.max(...petTypes.map((p) => p.order), 0);

    const created = await apiSend<any>("/api/config/pet-types", "POST", {
      id: data.id,
      name: data.name,
      icon: data.icon,
      active: data.active,
      order_index: maxOrder + 1,
    });
    await fetchPetTypes();
    return {
      id: created.id,
      name: created.name,
      icon: created.icon,
      active: created.active,
      order: created.order_index,
    };
  };

  const updatePetType = async (
    id: string,
    data: Partial<PetType>,
  ): Promise<PetType> => {
    const updated = await apiSend<any>("/api/config/pet-types", "PATCH", {
      id,
      name: data.name,
      icon: data.icon,
      active: data.active,
      order_index: data.order,
    });
    await fetchPetTypes();
    return {
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      active: updated.active,
      order: updated.order_index,
    };
  };

  const deletePetType = async (id: string): Promise<void> => {
    await apiSend<unknown>(`/api/config/pet-types?id=${id}`, "DELETE");
    await fetchPetTypes();
    await fetchPetSizes();
  };

  const createSize = async (data: Omit<PetSize, "order">): Promise<PetSize> => {
    const sizesForType = petSizes.filter((s) => s.petTypeId === data.petTypeId);
    const maxOrder = Math.max(...sizesForType.map((s) => s.order), 0);

    const created = await apiSend<any>("/api/config/pet-sizes", "POST", {
      id: data.id,
      pet_type_id: data.petTypeId,
      name: data.name,
      min_weight: data.minWeight,
      max_weight: data.maxWeight,
      description: data.description,
      active: data.active,
      order_index: maxOrder + 1,
    });
    await fetchPetSizes();
    return {
      id: created.id,
      petTypeId: created.pet_type_id,
      name: created.name,
      minWeight: created.min_weight,
      maxWeight: created.max_weight,
      description: created.description,
      active: created.active,
      order: created.order_index,
    };
  };

  const updateSize = async (
    id: string,
    data: Partial<PetSize>,
  ): Promise<PetSize> => {
    const updated = await apiSend<any>("/api/config/pet-sizes", "PATCH", {
      id,
      name: data.name,
      min_weight: data.minWeight,
      max_weight: data.maxWeight,
      description: data.description,
      active: data.active,
      order_index: data.order,
    });
    await fetchPetSizes();
    return {
      id: updated.id,
      petTypeId: updated.pet_type_id,
      name: updated.name,
      minWeight: updated.min_weight,
      maxWeight: updated.max_weight,
      description: updated.description,
      active: updated.active,
      order: updated.order_index,
    };
  };

  const deleteSize = async (id: string): Promise<void> => {
    await apiSend<unknown>(`/api/config/pet-sizes?id=${id}`, "DELETE");
    await fetchPetSizes();
  };

  useEffect(() => {
    fetchPetTypes();
    fetchPetSizes();
  }, [fetchPetTypes, fetchPetSizes]);

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
    createSize,
    updateSize,
    deleteSize,
    getSizesForPetType,
  };
}
