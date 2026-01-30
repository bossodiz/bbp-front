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

        const response = await fetch("/api/dashboard/today-bookings");
        if (!response.ok) {
          throw new Error("Failed to fetch today bookings");
        }

        const bookings = await response.json();
        setData(bookings);
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
