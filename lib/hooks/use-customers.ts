import { useState, useCallback } from "react";
import { useCustomerStore } from "@/lib/store";
import type { Customer, Pet } from "@/lib/types";
import { transformCustomer, transformPet } from "@/lib/utils/transformers";

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

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch customers");
      }

      // Transform data to match frontend types
      const transformedCustomers = result.data.map(transformCustomer);

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
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create customer");
      }

      const newCustomer: Customer = transformCustomer({ ...result.data, pets: [] });

      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    },
    [],
  );

  const updateCustomer = useCallback(
    async (id: number, data: { name: string; phone: string }) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update customer");
      }

      const updatedCustomer: Customer = {
        ...transformCustomer({ ...result.data, pets: [] }),
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
    const response = await fetch(`/api/customers/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to delete customer");
    }

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
      const response = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          name: data.name,
          type: data.type,
          breed: data.breed,
          breed_2: data.breed2 || null,
          is_mixed_breed: data.isMixedBreed,
          weight: data.weight,
          note: data.note || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create pet");
      }

      const newPet: Pet = transformPet(result.data);

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
      const response = await fetch(`/api/pets/${petId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          breed: data.breed,
          breed_2: data.breed2 || null,
          is_mixed_breed: data.isMixedBreed,
          weight: data.weight,
          note: data.note || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update pet");
      }

      const updatedPet: Pet = transformPet(result.data);

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
    const response = await fetch(`/api/pets/${petId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to delete pet");
    }

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
