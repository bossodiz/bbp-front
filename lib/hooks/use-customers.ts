import { useState, useCallback } from "react";
import { useCustomerStore } from "@/lib/store";
import type { Customer, Pet } from "@/lib/types";
import { transformCustomer, transformPet } from "@/lib/utils/transformers";
import { apiFetch, apiSend } from "@/lib/api";

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  fetchCustomers: (search?: string) => Promise<void>;
  createCustomer: (data: { name: string; phone: string }) => Promise<Customer>;
  updateCustomer: (
    id: number,
    data: { name: string; phone: string },
  ) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<void>;
  createPet: (
    customerId: number,
    data: {
      name: string;
      type: "DOG" | "CAT";
      breed: string;
      breed2?: string;
      isMixedBreed: boolean;
      weight: number | null;
      note?: string;
    },
  ) => Promise<Pet>;
  updatePet: (
    petId: number,
    data: {
      name: string;
      type: "DOG" | "CAT";
      breed: string;
      breed2?: string;
      isMixedBreed: boolean;
      weight: number | null;
      note?: string;
    },
  ) => Promise<Pet>;
  deletePet: (petId: number) => Promise<void>;
}

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = search
        ? `/api/customers?search=${encodeURIComponent(search)}`
        : "/api/customers";

      const rows = await apiFetch<any[]>(url);

      // Transform data to match frontend types
      const transformedCustomers = (rows ?? []).map(transformCustomer);

      setCustomers(transformedCustomers);
      // Sync to Zustand store
      useCustomerStore.setState({ customers: transformedCustomers });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(
    async (data: { name: string; phone: string }) => {
      const created = await apiSend<any>("/api/customers", "POST", data);

      const newCustomer: Customer = transformCustomer({ ...created, pets: [] });

      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    },
    [],
  );

  const updateCustomer = useCallback(
    async (id: number, data: { name: string; phone: string }) => {
      const updated = await apiSend<any>(`/api/customers/${id}`, "PATCH", data);

      const updatedCustomer: Customer = {
        ...transformCustomer({ ...updated, pets: [] }),
        pets: customers.find((c) => c.id === id)?.pets || [],
      };

      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? updatedCustomer : c)),
      );

      return updatedCustomer;
    },
    [customers],
  );

  const deleteCustomer = useCallback(async (id: number) => {
    await apiSend<unknown>(`/api/customers/${id}`, "DELETE");

    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const createPet = useCallback(
    async (
      customerId: number,
      data: {
        name: string;
        type: "DOG" | "CAT";
        breed: string;
        breed2?: string;
        isMixedBreed: boolean;
        weight: number | null;
        note?: string;
      },
    ) => {
      const created = await apiSend<any>("/api/pets", "POST", {
        customer_id: customerId,
        name: data.name,
        type: data.type,
        breed: data.breed,
        breed_2: data.breed2 || null,
        is_mixed_breed: data.isMixedBreed,
        weight: data.weight,
        note: data.note || null,
      });

      const newPet: Pet = transformPet(created);

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, pets: [...c.pets, newPet] } : c,
        ),
      );

      return newPet;
    },
    [],
  );

  const updatePet = useCallback(
    async (
      petId: number,
      data: {
        name: string;
        type: "DOG" | "CAT";
        breed: string;
        breed2?: string;
        isMixedBreed: boolean;
        weight: number | null;
        note?: string;
      },
    ) => {
      const updated = await apiSend<any>(`/api/pets/${petId}`, "PATCH", {
        name: data.name,
        type: data.type,
        breed: data.breed,
        breed_2: data.breed2 || null,
        is_mixed_breed: data.isMixedBreed,
        weight: data.weight,
        note: data.note || null,
      });

      const updatedPet: Pet = transformPet(updated);

      setCustomers((prev) =>
        prev.map((c) => ({
          ...c,
          pets: c.pets.map((p) => (p.id === petId ? updatedPet : p)),
        })),
      );

      return updatedPet;
    },
    [],
  );

  const deletePet = useCallback(async (petId: number) => {
    await apiSend<unknown>(`/api/pets/${petId}`, "DELETE");

    setCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        pets: c.pets.filter((p) => p.id !== petId),
      })),
    );
  }, []);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createPet,
    updatePet,
    deletePet,
  };
}
