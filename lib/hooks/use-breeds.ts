import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api-client";

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

      const result = await apiRequest<Breed[]>(`/breeds?${params.toString()}`);
      setBreeds((result.data as Breed[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch breeds");
    } finally {
      setLoading(false);
    }
  }, [petTypeId, active]);

  const getBreed = async (id: number): Promise<BreedWithParents | null> => {
    try {
      const result = await apiRequest<BreedWithParents>(`/breeds/${id}`);
      return (result.data as BreedWithParents) || null;
    } catch (err: any) {
      if (err.status === 404) return null;
      throw err;
    }
  };

  const createBreed = async (breedData: {
    pet_type_id: string;
    name: string;
    order_index: number;
    active?: boolean;
  }): Promise<Breed> => {
    const result = await apiRequest<Breed>("/breeds", {
      method: "POST",
      body: JSON.stringify(breedData),
    });
    await fetchBreeds();
    return result.data as Breed;
  };

  const updateBreed = async (
    id: number,
    updates: Partial<Omit<Breed, "id" | "created_at" | "updated_at">>,
  ): Promise<Breed> => {
    const result = await apiRequest<Breed>(`/breeds/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    await fetchBreeds();
    return result.data as Breed;
  };

  const deleteBreed = async (id: number): Promise<void> => {
    await apiRequest(`/breeds/${id}`, { method: "DELETE" });
    await fetchBreeds();
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
