"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiRequest } from "@/lib/api-client";
import type { Sale } from "@/lib/types";

interface UseSalesOptions {
  startDate?: string;
  endDate?: string;
  customerId?: number;
  autoFetch?: boolean;
}

export function useSales(options: UseSalesOptions = {}) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionsKey = useMemo(() => {
    return JSON.stringify({
      startDate: options.startDate || "",
      endDate: options.endDate || "",
      customerId: options.customerId || 0,
    });
  }, [options.startDate, options.endDate, options.customerId]);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.startDate) params.append("startDate", options.startDate);
      if (options.endDate) params.append("endDate", options.endDate);
      const query = params.toString() ? `?${params.toString()}` : "";
      const result = await apiRequest(`/sales${query}`);

      let data = (result.data as any[]) || [];

      // Client-side filter by customerId if needed
      if (options.customerId) {
        data = data.filter((s: any) => s.customerId === options.customerId);
      }

      setSales(data);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [options.startDate, options.endDate, options.customerId]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchSales();
    }
  }, [optionsKey, options.autoFetch, fetchSales]);

  return {
    sales,
    isLoading,
    error,
    refetch: fetchSales,
  };
}
