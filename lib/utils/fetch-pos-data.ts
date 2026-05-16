import {
  useCustomerStore,
  useServiceStore,
  usePromotionStore,
  useServiceConfigStore,
} from "@/lib/store";
import type { Promotion } from "@/lib/types";
import { transformCustomer, transformService } from "@/lib/utils/transformers";

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

  const customers = result.data.map(transformCustomer);

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

  const services = (data.data || []).map(transformService);

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
