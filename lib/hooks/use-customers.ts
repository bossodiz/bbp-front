import { useState, useCallback } from "react";
import { useCustomerStore } from "@/lib/store";
import { apiRequest } from "@/lib/api-client";
import type { Customer, Pet } from "@/lib/types";

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

function transformCustomer(customer: any): Customer {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    createdAt: new Date(customer.created_at || customer.createdAt),
    updatedAt: new Date(customer.updated_at || customer.updatedAt),
    pets: (customer.pets || []).map((pet: any) => transformPet(pet)),
  };
}

function transformPet(pet: any): Pet {
  return {
    id: pet.id,
    customerId: pet.customer_id || pet.customerId,
    name: pet.name,
    type: pet.type,
    breed: pet.breed || "",
    breed2: pet.breed_2 || pet.breed2 || undefined,
    isMixedBreed: pet.is_mixed_breed || pet.isMixedBreed || false,
    weight:
      pet.weight !== null && pet.weight !== undefined
        ? parseFloat(pet.weight)
        : null,
    note: pet.note || "",
    createdAt: new Date(pet.created_at || pet.createdAt),
    updatedAt: new Date(pet.updated_at || pet.updatedAt),
  };
}

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const result = await apiRequest(`/customers${params}`);
      const transformedCustomers = ((result.data as any[]) || []).map(
        transformCustomer,
      );

      setCustomers(transformedCustomers);
      useCustomerStore.setState({ customers: transformedCustomers });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(
    async (data: { name: string; phone: string }) => {
      const result = await apiRequest("/customers", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const d = result.data as any;

      const newCustomer: Customer = {
        id: d.id,
        name: d.name,
        phone: d.phone,
        createdAt: new Date(d.created_at || d.createdAt),
        updatedAt: new Date(d.updated_at || d.updatedAt),
        pets: [],
      };

      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    },
    [],
  );

  const updateCustomer = useCallback(
    async (id: number, data: { name: string; phone: string }) => {
      const result = await apiRequest(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const d = result.data as any;

      const updatedCustomer: Customer = {
        id: d.id,
        name: d.name,
        phone: d.phone,
        createdAt: new Date(d.created_at || d.createdAt),
        updatedAt: new Date(d.updated_at || d.updatedAt),
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
    await apiRequest(`/customers/${id}`, { method: "DELETE" });
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
      const result = await apiRequest("/pets", {
        method: "POST",
        body: JSON.stringify({
          customer_id: customerId,
          name: data.name,
          type: data.type,
          breed: data.breed,
          weight: data.weight || undefined,
          note: data.note || undefined,
        }),
      });

      const newPet = transformPet(result.data);

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
      const result = await apiRequest(`/pets/${petId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          breed: data.breed,
          weight: data.weight || undefined,
          note: data.note || undefined,
        }),
      });

      const updatedPet = transformPet(result.data);

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
    await apiRequest(`/pets/${petId}`, { method: "DELETE" });

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
