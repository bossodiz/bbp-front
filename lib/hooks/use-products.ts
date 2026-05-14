"use client";

import { useState, useEffect, useCallback } from "react";
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

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "ไม่สามารถดึงข้อมูลสินค้าได้");
      }

      const result = await response.json();
      // API ส่งคืน { success, data: { data: [...], pagination }, timestamp }
      // ดึง products array ออกมา รองรับทั้งแบบ paginated และ flat array
      const productsList = Array.isArray(result?.data?.data)
        ? result.data.data
        : Array.isArray(result?.data)
          ? result.data
          : [];
      setProducts(productsList);
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาด");
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
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "ไม่สามารถสร้างสินค้าได้");
    }

    await fetchProducts();
    return (await response.json()).data;
  };

  const updateProduct = async (id: number, productData: Partial<Product>) => {
    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "ไม่สามารถแก้ไขสินค้าได้");
    }

    await fetchProducts();
    return (await response.json()).data;
  };

  const deleteProduct = async (id: number) => {
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "ไม่สามารถลบสินค้าได้");
    }

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
