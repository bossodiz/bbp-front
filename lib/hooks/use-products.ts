"use client";

import { useState, useEffect, useCallback } from "react";
import type { Product } from "@/lib/types";
import { apiFetch, apiSend } from "@/lib/api";

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

      // API ส่งคืน { data: [...], error, pagination } — apiFetch คืน data (แถวสินค้า)
      const productsList = await apiFetch<Product[]>(`/api/products?${params.toString()}`);
      setProducts(productsList ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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
    const created = await apiSend<Product>("/api/products", "POST", productData);
    await fetchProducts();
    return created;
  };

  const updateProduct = async (id: number, productData: Partial<Product>) => {
    const updated = await apiSend<Product>(`/api/products/${id}`, "PUT", productData);
    await fetchProducts();
    return updated;
  };

  const deleteProduct = async (id: number) => {
    await apiSend<unknown>(`/api/products/${id}`, "DELETE");
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
