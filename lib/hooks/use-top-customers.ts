"use client";

import { useState, useEffect } from "react";

interface TopCustomer {
  customerId: number;
  customerName: string;
  customerPhone: string;
  totalSpent: number;
  visitCount: number;
}

export function useTopCustomers() {
  const [data, setData] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard/top-customers");
        if (!response.ok) {
          throw new Error("Failed to fetch top customers");
        }

        const customers = await response.json();
        setData(customers);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
