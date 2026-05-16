import { useState, useEffect, useCallback } from "react";

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

      const response = await fetch("/api/config/pet-types");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch pet types");
      }

      const data = await response.json();
      const formattedData = (data.data || []).map((item: { id: string; name: string; icon?: string; active: boolean; order_index: number }) => ({
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

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch pet sizes");
      }

      const data = await response.json();
      const formattedData = (data.data || []).map((item: { id: string; pet_type_id: string; name: string; min_weight?: number; max_weight?: number; description?: string; active: boolean; order_index: number }) => ({
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

    const response = await fetch("/api/config/pet-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.id,
        name: data.name,
        icon: data.icon,
        active: data.active,
        order_index: maxOrder + 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create pet type");
    }

    const result = await response.json();
    await fetchPetTypes();
    return {
      id: result.data.id,
      name: result.data.name,
      icon: result.data.icon,
      active: result.data.active,
      order: result.data.order_index,
    };
  };

  const updatePetType = async (
    id: string,
    data: Partial<PetType>,
  ): Promise<PetType> => {
    const response = await fetch("/api/config/pet-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: data.name,
        icon: data.icon,
        active: data.active,
        order_index: data.order,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update pet type");
    }

    const result = await response.json();
    await fetchPetTypes();
    return {
      id: result.data.id,
      name: result.data.name,
      icon: result.data.icon,
      active: result.data.active,
      order: result.data.order_index,
    };
  };

  const deletePetType = async (id: string): Promise<void> => {
    const response = await fetch(`/api/config/pet-types?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete pet type");
    }

    await fetchPetTypes();
    await fetchPetSizes();
  };

  const createSize = async (data: Omit<PetSize, "order">): Promise<PetSize> => {
    const sizesForType = petSizes.filter((s) => s.petTypeId === data.petTypeId);
    const maxOrder = Math.max(...sizesForType.map((s) => s.order), 0);

    const response = await fetch("/api/config/pet-sizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.id,
        pet_type_id: data.petTypeId,
        name: data.name,
        min_weight: data.minWeight,
        max_weight: data.maxWeight,
        description: data.description,
        active: data.active,
        order_index: maxOrder + 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create size");
    }

    const result = await response.json();
    await fetchPetSizes();
    return {
      id: result.data.id,
      petTypeId: result.data.pet_type_id,
      name: result.data.name,
      minWeight: result.data.min_weight,
      maxWeight: result.data.max_weight,
      description: result.data.description,
      active: result.data.active,
      order: result.data.order_index,
    };
  };

  const updateSize = async (
    id: string,
    data: Partial<PetSize>,
  ): Promise<PetSize> => {
    const response = await fetch("/api/config/pet-sizes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update size");
    }

    const result = await response.json();
    await fetchPetSizes();
    return {
      id: result.data.id,
      petTypeId: result.data.pet_type_id,
      name: result.data.name,
      minWeight: result.data.min_weight,
      maxWeight: result.data.max_weight,
      description: result.data.description,
      active: result.data.active,
      order: result.data.order_index,
    };
  };

  const deleteSize = async (id: string): Promise<void> => {
    const response = await fetch(`/api/config/pet-sizes?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete size");
    }

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
