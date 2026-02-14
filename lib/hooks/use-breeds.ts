import { useState, useEffect, useCallback } from "react";

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

      const response = await fetch(`/api/breeds?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch breeds");
      }

      const data = await response.json();
      setBreeds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch breeds");
    } finally {
      setLoading(false);
    }
  }, [petTypeId, active]);

  const getBreed = async (id: number): Promise<BreedWithParents | null> => {
    try {
      const response = await fetch(`/api/breeds/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch breed");
      }

      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const createBreed = async (breedData: {
    pet_type_id: string;
    name: string;
    order_index: number;
    active?: boolean;
  }): Promise<Breed> => {
    try {
      const response = await fetch("/api/breeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(breedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create breed");
      }

      const newBreed = await response.json();
      await fetchBreeds(); // Refresh list
      return newBreed;
    } catch (err) {
      throw err;
    }
  };

  const updateBreed = async (
    id: number,
    updates: Partial<Omit<Breed, "id" | "created_at" | "updated_at">>,
  ): Promise<Breed> => {
    try {
      const response = await fetch(`/api/breeds/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update breed");
      }

      const updatedBreed = await response.json();
      await fetchBreeds(); // Refresh list
      return updatedBreed;
    } catch (err) {
      throw err;
    }
  };

  const deleteBreed = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`/api/breeds/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete breed");
      }

      await fetchBreeds(); // Refresh list
    } catch (err) {
      throw err;
    }
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
