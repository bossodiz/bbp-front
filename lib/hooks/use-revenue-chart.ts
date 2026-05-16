"use client";

import { useState, useEffect } from "react";

export interface RevenueChartPoint {
  key: string;
  date: string;
  revenue: number;
  service: number;
  hotel: number;
  product: number;
}

interface RevenueChartData {
  points: RevenueChartPoint[];
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export function useRevenueChart(
  period: "weekly" | "monthly" | "yearly" | "last12months",
) {
  const [data, setData] = useState<RevenueChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/dashboard/revenue-chart?period=${period}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch revenue chart data");
        }

        const chartData = await response.json();
        setData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return { data, loading, error };
}
