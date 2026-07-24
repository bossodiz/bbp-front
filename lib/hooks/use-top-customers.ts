"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

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

        const customers = await apiFetch<TopCustomer[]>(
          `/api/dashboard/top-customers?type=${type}`,
        );
        setData(customers ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  return { data, loading, error };
}
