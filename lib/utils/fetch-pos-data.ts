import {
  useCustomerStore,
  useServiceStore,
  usePromotionStore,
  useServiceConfigStore,
} from "@/lib/store";
import type { Customer, Service, Promotion } from "@/lib/types";

/** Fetch customers from API and sync to Zustand store (no React state) */
export async function fetchCustomersToStore(search?: string): Promise<void> {
  const url = search
    ? `/api/customers?search=${encodeURIComponent(search)}`
    : "/api/customers";

  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch customers");
  }

  const customers: Customer[] = result.data.map((customer: any) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    createdAt: new Date(customer.created_at),
    updatedAt: new Date(customer.updated_at),
    pets: (customer.pets || []).map((pet: any) => ({
      id: pet.id,
      customerId: pet.customer_id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed || "",
      breed2: pet.breed_2 || undefined,
      isMixedBreed: pet.is_mixed_breed || false,
      weight: parseFloat(pet.weight),
      note: pet.note || "",
      createdAt: new Date(pet.created_at),
      updatedAt: new Date(pet.updated_at),
    })),
  }));

  useCustomerStore.setState({ customers });
}

/** Fetch services from API and sync to Zustand store (no React state) */
export async function fetchServicesToStore(): Promise<void> {
  const response = await fetch("/api/services");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch services");
  }

  const data = await response.json();

  const services: Service[] = (data.data || []).map((service: any) => ({
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

  useServiceStore.setState({ services });
}

/** Fetch promotions from API and sync to Zustand store (no React state) */
export async function fetchPromotionsToStore(): Promise<void> {
  const response = await fetch("/api/promotions");
  if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลโปรโมชั่นได้");
  const promotions: Promotion[] = await response.json();
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
