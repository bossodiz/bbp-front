"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface SaleItem {
  petType: string;
}

interface Sale {
  id: number;
  createdAt: string;
  items: SaleItem[];
}

interface PetServiceChartData {
  sales: Sale[];
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export function usePetServiceChart(
  period: "weekly" | "monthly" | "yearly" | "last12months",
) {
  const [data, setData] = useState<PetServiceChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const chartData = await apiFetch<PetServiceChartData>(
          `/api/dashboard/pet-service-chart?period=${period}`,
        );
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
