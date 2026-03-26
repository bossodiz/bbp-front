"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api-client";

export interface MasterBreed {
  id: number;
  name: string;
}

export function useMasterBreeds(petTypeId?: number) {
  const [breeds, setBreeds] = useState<MasterBreed[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBreeds = useCallback(async () => {
    if (!petTypeId) {
      setBreeds([]);
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest<MasterBreed[]>(
        `/master/breeds?petTypeId=${petTypeId}`,
      );
      setBreeds((result.data as MasterBreed[]) || []);
    } catch {
      setBreeds([]);
    } finally {
      setLoading(false);
    }
  }, [petTypeId]);

  useEffect(() => {
    fetchBreeds();
  }, [fetchBreeds]);

  return { breeds, loading };
}
