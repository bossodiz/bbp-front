"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  HotelBooking,
  HotelBookingStatus,
  HotelAdditionalService,
} from "@/lib/types";
import { apiFetch, apiSend } from "@/lib/api";

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
      const rows = await apiFetch<HotelBooking[]>(url);
      setBookings(rows ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
      petIds: number[];
      checkInDate: string;
      ratePerNight: number;
      depositAmount?: number;
      note?: string;
    }) => {
      const created = await apiSend<HotelBooking>("/api/hotel", "POST", data);
      await fetchBookings();
      return created;
    },
    [fetchBookings],
  );

  const updateBooking = useCallback(
    async (id: number, data: Record<string, any>) => {
      const updated = await apiSend<HotelBooking>(`/api/hotel/${id}`, "PUT", data);
      await fetchBookings();
      return updated;
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
        additionalServices?: Pick<
          HotelAdditionalService,
          | "serviceId"
          | "serviceName"
          | "originalPrice"
          | "finalPrice"
          | "isPriceModified"
        >[];
        discountAmount?: number;
        paymentMethod?: string;
        cashReceived?: number;
        note?: string;
        promotionId?: number;
        customDiscount?: number;
      },
    ) => {
      const result = await apiSend<HotelBooking>(`/api/hotel/${id}/checkout`, "POST", data);
      await fetchBookings();
      return result;
    },
    [fetchBookings],
  );

  const deleteBooking = useCallback(
    async (id: number) => {
      await apiSend<unknown>(`/api/hotel/${id}`, "DELETE");
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
