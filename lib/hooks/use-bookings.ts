import { useState, useEffect, useCallback } from "react";
import type { Booking } from "@/lib/types";

interface UseBookingsOptions {
  status?: string;
  date?: string;
  fromDate?: string;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ดึงข้อมูลนัดหมายทั้งหมด
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.status) params.append("status", options.status);
      if (options.date) params.append("date", options.date);
      if (options.fromDate) params.append("fromDate", options.fromDate);

      const response = await fetch(`/api/bookings?${params.toString()}`);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลนัดหมายได้");
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [options.status, options.date, options.fromDate]);

  // สร้างนัดหมายใหม่
  const addBooking = async (
    bookingData: Omit<Booking, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "ไม่สามารถสร้างนัดหมายได้");
      }

      const newBooking = await response.json();
      await fetchBookings();
      return newBooking;
    } catch (err) {
      throw err;
    }
  };

  // อัพเดทนัดหมาย
  const updateBooking = async (id: number, data: Partial<Booking>) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "ไม่สามารถอัพเดทนัดหมายได้");
      }

      const updatedBooking = await response.json();
      await fetchBookings();
      return updatedBooking;
    } catch (err) {
      throw err;
    }
  };

  // ลบนัดหมาย
  const deleteBooking = async (id: number) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "ไม่สามารถลบนัดหมายได้");
      }

      await fetchBookings();
    } catch (err) {
      throw err;
    }
  };

  // ยึดมัดจำ
  const forfeitDeposit = async (id: number) => {
    try {
      await updateBooking(id, {
        depositStatus: "FORFEITED",
        depositForfeitedDate: new Date(),
      });
    } catch (err) {
      throw err;
    }
  };

  // คืนมัดจำ
  const refundDeposit = async (id: number) => {
    try {
      await updateBooking(id, {
        depositStatus: "NONE",
        depositAmount: 0,
        depositForfeitedDate: undefined,
      });
    } catch (err) {
      throw err;
    }
  };

  // ใช้มัดจำ
  const useDeposit = async (id: number) => {
    try {
      await updateBooking(id, {
        depositStatus: "USED",
      });
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    addBooking,
    updateBooking,
    deleteBooking,
    forfeitDeposit,
    refundDeposit,
    useDeposit,
  };
}
