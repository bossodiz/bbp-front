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

        const { apiRequest } = await import("@/lib/api-client");
        const result = await apiRequest<TopCustomer[]>(
          `/dashboard/top-customers?type=${type}`,
        );
        setData((result.data as TopCustomer[]) || []);
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
