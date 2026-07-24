"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

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

        const bookings = await apiFetch<TodayBooking[]>("/api/dashboard/today-bookings");
        setData(bookings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
