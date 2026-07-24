import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiSend, ApiError } from "@/lib/api";

export interface Breed {
  id: number;
  pet_type_id: string;
  name: string;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BreedWithParents extends Breed {
  parent_breed_1?: { id: number; name: string } | null;
  parent_breed_2?: { id: number; name: string } | null;
}

interface UseBreedsOptions {
  petTypeId?: string;
  active?: boolean;
  autoFetch?: boolean;
}

export function useBreeds(options: UseBreedsOptions = {}) {
  const { petTypeId, active = true, autoFetch = true } = options;

  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBreeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (petTypeId) params.append("petTypeId", petTypeId);
      if (active !== undefined) params.append("active", String(active));

      const data = await apiFetch<Breed[]>(`/api/breeds?${params.toString()}`);
      setBreeds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch breeds");
    } finally {
      setLoading(false);
    }
  }, [petTypeId, active]);

  const getBreed = async (id: number): Promise<BreedWithParents | null> => {
    try {
      return await apiFetch<BreedWithParents>(`/api/breeds/${id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  };

  const createBreed = async (breedData: {
    pet_type_id: string;
    name: string;
    order_index: number;
    active?: boolean;
  }): Promise<Breed> => {
    const newBreed = await apiSend<Breed>("/api/breeds", "POST", breedData);
    await fetchBreeds(); // Refresh list
    return newBreed;
  };

  const updateBreed = async (
    id: number,
    updates: Partial<Omit<Breed, "id" | "created_at" | "updated_at">>,
  ): Promise<Breed> => {
    const updatedBreed = await apiSend<Breed>(`/api/breeds/${id}`, "PATCH", updates);
    await fetchBreeds(); // Refresh list
    return updatedBreed;
  };

  const deleteBreed = async (id: number): Promise<void> => {
    await apiSend<unknown>(`/api/breeds/${id}`, "DELETE");
    await fetchBreeds(); // Refresh list
  };

  useEffect(() => {
    if (autoFetch) {
      fetchBreeds();
    }
  }, [autoFetch, fetchBreeds]);

  return {
    breeds,
    loading,
    error,
    fetchBreeds,
    getBreed,
    createBreed,
    updateBreed,
    deleteBreed,
  };
}
