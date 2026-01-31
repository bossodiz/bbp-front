import { useState, useEffect, useCallback } from "react";

export interface DashboardData {
  sales: Array<{
    id: number;
    customerId: number | null;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    items: Array<{
      id: number;
      petId: number | null;
      petType: "DOG" | "CAT";
      serviceId: number;
      serviceName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      pet: {
        id: number;
        name: string;
        type: "DOG" | "CAT";
      } | null;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  bookings: Array<{
    id: number;
    customerId: number | null;
    customerName: string;
    phone: string;
    pets: Array<{
      petId: number;
      name: string;
      type: "DOG" | "CAT";
      breed: string;
      service: string;
    }>;
    serviceType: string;
    bookingDate: string;
    bookingTime: string;
    note: string;
    depositAmount: number;
    depositStatus: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  todayStats: {
    revenue: number;
    dogs: number;
    cats: number;
    bookings: number;
  };
  topCustomers: Array<{
    id: string;
    name: string;
    phone: string;
    visits: number;
    totalSpent: number;
  }>;
  recentBookings: Array<any>; // same as bookings but filtered
  period: string;
  dateRange: {
    start: string;
    end: string;
    bkkStart: string;
    bkkEnd: string;
  };
}

interface UseDashboardOptions {
  period?: "weekly" | "monthly" | "yearly";
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.period) params.append("period", options.period);

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูล dashboard ได้");
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [options.period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
}
