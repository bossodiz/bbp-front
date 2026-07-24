import { useState, useEffect, useCallback } from "react";
import { useServiceStore } from "@/lib/store";
import type { Service } from "@/lib/types";
import { transformService } from "@/lib/utils/transformers";
import { apiFetch, apiSend } from "@/lib/api";

interface UseServicesOptions {
  petTypeId?: string;
  active?: boolean;
  autoFetch?: boolean;
}

interface UseServicesReturn {
  services: Service[];
  loading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  createService: (data: Omit<Service, "id">) => Promise<Service>;
  updateService: (id: number, data: Partial<Service>) => Promise<Service>;
  deleteService: (id: number) => Promise<void>;
  toggleServiceStatus: (id: number) => Promise<Service>;
}

export function useServices(
  options: UseServicesOptions = {},
): UseServicesReturn {
  const { petTypeId, active, autoFetch = true } = options;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (petTypeId) params.append("petTypeId", petTypeId);
      if (active !== undefined) params.append("active", String(active));

      const rows = await apiFetch<any[]>(`/api/services?${params.toString()}`);

      // Transform snake_case to camelCase
      const transformedServices = (rows ?? []).map(transformService);

      setServices(transformedServices);
      // Sync to Zustand store
      useServiceStore.setState({ services: transformedServices });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [petTypeId, active]);

  const createService = async (data: Omit<Service, "id">): Promise<Service> => {
    const created = await apiSend<Service>("/api/services", "POST", data);
    await fetchServices(); // Refresh list
    return created;
  };

  const updateService = async (
    id: number,
    data: Partial<Service>,
  ): Promise<Service> => {
    const updated = await apiSend<Service>(`/api/services/${id}`, "PATCH", data);
    await fetchServices(); // Refresh list
    return updated;
  };

  const deleteService = async (id: number): Promise<void> => {
    await apiSend<unknown>(`/api/services/${id}`, "DELETE");
    await fetchServices(); // Refresh list
  };

  const toggleServiceStatus = async (id: number): Promise<Service> => {
    const service = services.find((s) => s.id === id);
    if (!service) {
      throw new Error("Service not found");
    }

    return updateService(id, { active: !service.active });
  };

  useEffect(() => {
    if (autoFetch) {
      fetchServices();
    }
  }, [autoFetch, fetchServices]);

  return {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
  };
}
