"use client";

import { useState, useEffect } from "react";

interface TopCustomer {
  customerId: number;
  customerName: string;
  customerPhone: string;
  totalSpent: number;
  visitCount: number;
}

export type CustomerViewType = "frequent_visits" | "high_revenue";

export function useTopCustomers(type: CustomerViewType = "frequent_visits") {
  const [data, setData] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/dashboard/top-customers?type=${type}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch top customers");
        }

        const result = await response.json();
        // Handle both response formats: wrapped { data: [...] } or direct array
        const customers = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];
        setData(customers);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  return { data, loading, error };
}
