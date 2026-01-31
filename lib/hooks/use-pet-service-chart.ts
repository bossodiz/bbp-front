"use client";

import { useState, useEffect } from "react";

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

export function usePetServiceChart(period: "weekly" | "monthly" | "yearly") {
  const [data, setData] = useState<PetServiceChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/dashboard/pet-service-chart?period=${period}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch pet service chart data");
        }

        const chartData = await response.json();
        setData(chartData);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return { data, loading, error };
}
