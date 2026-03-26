"use client";

import { apiRequest } from "@/lib/api-client";

export function usePOSCart() {
  const createSale = async (data: Record<string, any>) => {
    const result = await apiRequest("/sales", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data;
  };

  return { createSale };
}
