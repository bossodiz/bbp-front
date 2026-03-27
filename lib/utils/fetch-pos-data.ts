import {
  useCustomerStore,
  useServiceStore,
  usePromotionStore,
  useServiceConfigStore,
} from "@/lib/store";
import { apiRequest } from "@/lib/api-client";
import type { Customer, Service, Promotion } from "@/lib/types";

/** Fetch customers from API and sync to Zustand store (no React state) */
export async function fetchCustomersToStore(search?: string): Promise<void> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const result = await apiRequest(`/customers${params}`);

  const customers: Customer[] = ((result.data as any[]) || []).map(
    (customer: any) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      createdAt: new Date(customer.created_at || customer.createdAt),
      updatedAt: new Date(customer.updated_at || customer.updatedAt),
      pets: (customer.pets || []).map((pet: any) => ({
        id: pet.id,
        customerId: pet.customerId,
        name: pet.name,
        type: pet.type,
        breed: pet.breed || "",
        breed2: pet.breed2 || undefined,
        isMixedBreed: pet.isMixedBreed || false,
        weight:
          pet.weight !== null && pet.weight !== undefined
            ? parseFloat(pet.weight)
            : null,
        note: pet.note || "",
        createdAt: new Date(pet.createdAt),
        updatedAt: new Date(pet.updatedAt),
      })),
    }),
  );

  useCustomerStore.setState({ customers });
}

/** Fetch services from API and sync to Zustand store (no React state) */
export async function fetchServicesToStore(): Promise<void> {
  const result = await apiRequest("/services");

  const services: Service[] = ((result.data as any[]) || []).map(
    (service: any) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      isSpecial: service.isSpecial || false,
      specialPrice: service.specialPrice,
      active: service.active,
      order: service.orderIndex || 0,
      createdAt: new Date(service.createdAt),
      updatedAt: new Date(service.updatedAt),
      prices: (service.servicePrices || []).map((price: any) => ({
        id: price.id,
        serviceId: service.id,
        petTypeId: price.petTypeId,
        sizeId: price.sizeId,
        price: price.price,
      })),
    }),
  );

  useServiceStore.setState({ services });
}

/** Fetch promotions from API and sync to Zustand store (no React state) */
export async function fetchPromotionsToStore(): Promise<void> {
  const result = await apiRequest("/promotions");
  const promotions = (result.data as Promotion[]) || [];
  usePromotionStore.setState({ promotions });
}

/** Fetch all POS initial data in parallel */
export async function fetchAllPOSData(): Promise<void> {
  await Promise.all([
    fetchCustomersToStore(),
    fetchServicesToStore(),
    fetchPromotionsToStore(),
    useServiceConfigStore.getState().fetchPetTypes(),
    useServiceConfigStore.getState().fetchSizes(),
  ]);
}
