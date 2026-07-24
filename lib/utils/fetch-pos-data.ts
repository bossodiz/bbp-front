import {
  useCustomerStore,
  useServiceStore,
  usePromotionStore,
  useServiceConfigStore,
} from "@/lib/store";
import type { Promotion } from "@/lib/types";
import { transformCustomer, transformService } from "@/lib/utils/transformers";
import { apiFetch } from "@/lib/api";

/** Fetch customers from API and sync to Zustand store (no React state) */
export async function fetchCustomersToStore(search?: string): Promise<void> {
  const url = search
    ? `/api/customers?search=${encodeURIComponent(search)}`
    : "/api/customers";

  const rows = await apiFetch<any[]>(url);
  const customers = (rows ?? []).map(transformCustomer);

  useCustomerStore.setState({ customers });
}

/** Fetch services from API and sync to Zustand store (no React state) */
export async function fetchServicesToStore(): Promise<void> {
  const rows = await apiFetch<any[]>("/api/services");
  const services = (rows ?? []).map(transformService);

  useServiceStore.setState({ services });
}

/** Fetch promotions from API and sync to Zustand store (no React state) */
export async function fetchPromotionsToStore(): Promise<void> {
  const promotions = await apiFetch<Promotion[]>("/api/promotions");
  usePromotionStore.setState({ promotions: promotions ?? [] });
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
