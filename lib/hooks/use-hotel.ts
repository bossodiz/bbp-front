"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { HotelBooking, HotelBookingStatus } from "@/lib/types";

interface UseHotelOptions {
  status?: string;
  customerId?: number;
  autoFetch?: boolean;
}

export function useHotel(options: UseHotelOptions = {}) {
  const { status, customerId, autoFetch = true } = options;
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stableOptions = useMemo(
    () => ({ status, customerId }),
    [status, customerId],
  );

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (stableOptions.status) params.set("status", stableOptions.status);
      if (stableOptions.customerId)
        params.set("customerId", stableOptions.customerId.toString());

      const url = `/api/hotel${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");
      }

      setBookings(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [stableOptions]);

  useEffect(() => {
    if (autoFetch) {
      fetchBookings();
    }
  }, [autoFetch, fetchBookings]);

  const createBooking = useCallback(
    async (data: {
      customerId: number;
      petId: number;
      checkInDate: string;
      ratePerNight: number;
      depositAmount?: number;
      note?: string;
    }) => {
      const response = await fetch("/api/hotel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถสร้างการจองได้");
      }

      await fetchBookings();
      return result.data;
    },
    [fetchBookings],
  );

  const updateBooking = useCallback(
    async (id: number, data: Record<string, any>) => {
      const response = await fetch(`/api/hotel/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถอัพเดตการจองได้");
      }

      await fetchBookings();
      return result.data;
    },
    [fetchBookings],
  );

  const checkIn = useCallback(
    async (id: number) => {
      return updateBooking(id, { status: "CHECKED_IN" });
    },
    [updateBooking],
  );

  const cancelBooking = useCallback(
    async (id: number) => {
      return updateBooking(id, { status: "CANCELLED" });
    },
    [updateBooking],
  );

  const checkout = useCallback(
    async (
      id: number,
      data: {
        checkOutDate: string;
        additionalServices?: any[];
        discountAmount?: number;
        paymentMethod?: string;
        cashReceived?: number;
        note?: string;
        promotionId?: number;
        customDiscount?: number;
      },
    ) => {
      const response = await fetch(`/api/hotel/${id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถ checkout ได้");
      }

      await fetchBookings();
      return result.data;
    },
    [fetchBookings],
  );

  const deleteBooking = useCallback(
    async (id: number) => {
      const response = await fetch(`/api/hotel/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถลบการจองได้");
      }

      await fetchBookings();
    },
    [fetchBookings],
  );

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    updateBooking,
    checkIn,
    cancelBooking,
    checkout,
    deleteBooking,
  };
}
