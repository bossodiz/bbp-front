import { useState, useEffect, useCallback } from "react";
import { useServiceStore } from "@/lib/store";
import { apiRequest } from "@/lib/api-client";
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

function transformService(service: any): Service {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    isSpecial: service.is_special || service.isSpecial || false,
    specialPrice: service.special_price || service.specialPrice,
    active: service.active,
    order: service.order_index || service.orderIndex || service.order || 0,
    createdAt: service.created_at || service.createdAt,
    updatedAt: service.updated_at || service.updatedAt,
    prices: (service.service_prices || service.prices || []).map(
      (price: any) => ({
        id: price.id,
        serviceId: service.id,
        petTypeId: price.pet_type_id || price.petTypeId,
        sizeId: price.size_id || price.sizeId,
        price: price.price,
      }),
    ),
  };
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

      const result = await apiRequest("/services");
      let transformed = ((result.data as any[]) || []).map(transformService);

      // Client-side filters
      if (active !== undefined) {
        transformed = transformed.filter((s) => s.active === active);
      }

      setServices(transformed);
      useServiceStore.setState({ services: transformed });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [petTypeId, active]);

  const createService = async (data: Omit<Service, "id">): Promise<Service> => {
    const result = await apiRequest("/services", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        is_special: data.isSpecial,
        special_price: data.specialPrice,
        active: data.active,
        order_index: data.order,
      }),
    });
    await fetchServices();
    return transformService(result.data);
  };

  const updateService = async (
    id: number,
    data: Partial<Service>,
  ): Promise<Service> => {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.isSpecial !== undefined) payload.is_special = data.isSpecial;
    if (data.specialPrice !== undefined)
      payload.special_price = data.specialPrice;
    if (data.active !== undefined) payload.active = data.active;
    if (data.order !== undefined) payload.order_index = data.order;

    const result = await apiRequest(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await fetchServices();
    return transformService(result.data);
  };

  const deleteService = async (id: number): Promise<void> => {
    await apiRequest(`/services/${id}`, { method: "DELETE" });
    await fetchServices();
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
