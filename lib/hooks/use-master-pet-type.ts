"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api-client";

export interface MasterPetType {
  id: number;
  key: string;
  name: string;
  icon?: string;
}

export function useMasterPetType() {
  const [petTypes, setPetTypes] = useState<MasterPetType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<MasterPetType[]>("/master/pet-types")
      .then((res) => setPetTypes((res.data as MasterPetType[]) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { petTypes, loading };
}
