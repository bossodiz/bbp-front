"use client";

import { useState, useEffect } from "react";

interface Pet {
  petId: number;
  name: string;
  type: string;
  breed: string;
  service: string;
}

interface TodayBooking {
  id: number;
  customerId: number;
  customerName: string;
  phone: string;
  pets: Pet[];
  bookingDate: string;
  bookingTime: string;
  status: string;
  depositAmount: number;
  note: string | null;
}

export function useTodayBookings() {
  const [data, setData] = useState<TodayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { apiRequest } = await import("@/lib/api-client");
        const result = await apiRequest<TodayBooking[]>(
          "/dashboard/today-bookings",
        );
        setData((result.data as TodayBooking[]) || []);
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
