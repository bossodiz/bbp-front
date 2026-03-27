import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api-client";
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
      const startDate = options.date || options.fromDate;
      const endDate = options.date;
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const query = params.toString() ? `?${params.toString()}` : "";
      const result = await apiRequest(`/bookings${query}`);
      const data = (result.data as any[]) || [];

      const transformed: Booking[] = data.map((b: any) => ({
        id: b.id,
        customerId: b.customerId,
        customerName: b.customerName,
        phone: b.phone,
        pets: b.pets || [],
        petIds: b.petIds || [],
        bookingDate: new Date(b.bookingDate),
        bookingTime: b.bookingTime,
        note: b.note || "",
        depositAmount: b.depositAmount || 0,
        depositStatus: b.depositStatus || "NONE",
        depositForfeitedDate: b.depositForfeitedDate
          ? new Date(b.depositForfeitedDate)
          : undefined,
        status: b.status || "PENDING",
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      }));

      // Client-side filter by status if needed
      const filtered = options.status
        ? transformed.filter((b) => b.status === options.status)
        : transformed;

      setBookings(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [options.status, options.date, options.fromDate]);

  // สร้างนัดหมายใหม่
  const addBooking = async (bookingData: Record<string, any>) => {
    const result = await apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
    await fetchBookings();
    return result.data;
  };

  // อัพเดทนัดหมาย
  const updateBooking = async (id: number, data: Partial<Booking>) => {
    const payload: Record<string, any> = {};
    if (data.status) payload.status = data.status;
    if (data.customerName) payload.customer_name = data.customerName;
    if (data.phone) payload.phone = data.phone;
    if (data.bookingDate) {
      payload.booking_date =
        data.bookingDate instanceof Date
          ? data.bookingDate.toISOString().split("T")[0]
          : String(data.bookingDate);
    }
    if (data.bookingTime) payload.booking_time = data.bookingTime;
    if (data.note !== undefined) payload.note = data.note;
    if (data.depositStatus) payload.deposit_status = data.depositStatus;
    if (data.depositAmount !== undefined)
      payload.deposit_amount = data.depositAmount;

    const result = await apiRequest(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await fetchBookings();
    return result.data;
  };

  // ลบนัดหมาย
  const deleteBooking = async (id: number) => {
    await apiRequest(`/bookings/${id}`, { method: "DELETE" });
    await fetchBookings();
  };

  // ยกเลิกนัดหมาย
  const cancelBooking = async (id: number) => {
    await updateBooking(id, { status: "CANCELLED" });
  };

  // ยึดมัดจำ
  const forfeitDeposit = async (id: number) => {
    await updateBooking(id, {
      depositStatus: "FORFEITED",
      depositForfeitedDate: new Date(),
    });
  };

  // คืนมัดจำ
  const refundDeposit = async (id: number) => {
    await updateBooking(id, {
      depositStatus: "NONE",
      depositAmount: 0,
      depositForfeitedDate: undefined,
    });
  };

  // ใช้มัดจำ
  const useDeposit = async (id: number) => {
    await updateBooking(id, { depositStatus: "USED" });
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
