"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Sale } from "@/lib/types";
import { apiFetch } from "@/lib/api";

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

  // Memoize options string to detect real changes
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
      if (options.customerId)
        params.append("customerId", options.customerId.toString());

      const url = `/api/sales${params.toString() ? `?${params.toString()}` : ""}`;
      // API ส่งคืน { data: [...], error, pagination } — apiFetch คืน data (แถวการขาย)
      const salesList = await apiFetch<Sale[]>(url);
      setSales(salesList ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล");
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
