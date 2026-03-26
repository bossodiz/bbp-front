"use client";

import { useState, useEffect } from "react";

interface DashboardStats {
  revenueToday: number;
  revenueTodayService: number;
  revenueTodayHotel: number;
  revenueTodayProduct: number;
  revenueMonthly: number;
  revenueMonthlyService: number;
  revenueMonthlyHotel: number;
  revenueMonthlyProduct: number;
  catsToday: number;
  dogsToday: number;
  bookingsToday: number;
  lowStockCount: number;
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const { apiRequest } = await import("@/lib/api-client");
        const result = await apiRequest<DashboardStats>("/dashboard/stats");
        setData((result.data as DashboardStats) || null);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { data, loading, error };
}
