"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api-client";
import type { Product } from "@/lib/types";

interface UseProductsOptions {
  autoFetch?: boolean;
  activeOnly?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { autoFetch = true, activeOnly = false } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (activeOnly) params.set("active", "true");

      const result = await apiRequest<any[]>(`/products?${params.toString()}`);
      setProducts((result.data as any[]) || []);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  const addProduct = async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ) => {
    const result = await apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
    await fetchProducts();
    return result.data;
  };

  const updateProduct = async (id: number, productData: Partial<Product>) => {
    const result = await apiRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
    await fetchProducts();
    return result.data;
  };

  const deleteProduct = async (id: number) => {
    await apiRequest(`/products/${id}`, { method: "DELETE" });
    await fetchProducts();
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
