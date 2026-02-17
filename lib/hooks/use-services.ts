import { useState, useEffect, useCallback } from "react";
import { useServiceStore } from "@/lib/store";
import type { Service } from "@/lib/types";

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

      const response = await fetch(`/api/services?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch services");
      }

      const data = await response.json();

      // Transform snake_case to camelCase
      const transformedServices = (data.data || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        isSpecial: service.is_special || false,
        specialPrice: service.special_price,
        active: service.active,
        order: service.order_index || 0,
        createdAt: service.created_at,
        updatedAt: service.updated_at,
        prices: (service.service_prices || []).map((price: any) => ({
          id: price.id,
          serviceId: service.id,
          petTypeId: price.pet_type_id,
          sizeId: price.size_id,
          price: price.price,
        })),
      }));

      setServices(transformedServices);
      // Sync to Zustand store
      useServiceStore.setState({ services: transformedServices });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [petTypeId, active]);

  const createService = async (data: Omit<Service, "id">): Promise<Service> => {
    const response = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create service");
    }

    const result = await response.json();
    await fetchServices(); // Refresh list
    return result.data;
  };

  const updateService = async (
    id: number,
    data: Partial<Service>,
  ): Promise<Service> => {
    const response = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update service");
    }

    const result = await response.json();
    await fetchServices(); // Refresh list
    return result.data;
  };

  const deleteService = async (id: number): Promise<void> => {
    const response = await fetch(`/api/services/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete service");
    }

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
