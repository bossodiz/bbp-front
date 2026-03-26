"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiRequest } from "@/lib/api-client";
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

      const result = await apiRequest<any[]>(
        `/hotel${params.toString() ? `?${params.toString()}` : ""}`,
      );
      setBookings((result.data as any[]) || []);
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
      const result = await apiRequest("/hotel", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await fetchBookings();
      return result.data;
    },
    [fetchBookings],
  );

  const updateBooking = useCallback(
    async (id: number, data: Record<string, any>) => {
      const result = await apiRequest(`/hotel/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
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
      const result = await apiRequest(`/hotel/${id}/checkout`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      await fetchBookings();
      return result.data;
    },
    [fetchBookings],
  );

  const deleteBooking = useCallback(
    async (id: number) => {
      await apiRequest(`/hotel/${id}`, { method: "DELETE" });
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
