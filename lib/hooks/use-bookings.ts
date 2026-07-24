import { useState, useEffect, useCallback } from "react";
import type { Booking } from "@/lib/types";
import { apiFetch, apiSend } from "@/lib/api";

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

      const data = await apiFetch<Booking[]>(`/api/bookings?${params.toString()}`);
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
    const newBooking = await apiSend<Booking>("/api/bookings", "POST", bookingData);
    await fetchBookings();
    return newBooking;
  };

  // อัพเดทนัดหมาย
  const updateBooking = async (id: number, data: Partial<Booking>) => {
    const updatedBooking = await apiSend<Booking>(`/api/bookings/${id}`, "PUT", data);
    await fetchBookings();
    return updatedBooking;
  };

  // ลบนัดหมาย
  const deleteBooking = async (id: number) => {
    await apiSend<unknown>(`/api/bookings/${id}`, "DELETE");
    await fetchBookings();
  };

  // ยกเลิกนัดหมาย
  const cancelBooking = async (id: number) => {
    try {
      await updateBooking(id, {
        status: "CANCELLED",
      });
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
    cancelBooking,
    forfeitDeposit,
    refundDeposit,
    useDeposit,
  };
}
