"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

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

        const stats = await apiFetch<DashboardStats>("/api/dashboard/stats");
        setData(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { data, loading, error };
}
