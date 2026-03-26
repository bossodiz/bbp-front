"use client";

import { apiRequest } from "@/lib/api-client";

export function useBookingDialog() {
  const createBooking = async (data: Record<string, any>) => {
    const result = await apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data;
  };

  const updateBooking = async (id: number, data: Record<string, any>) => {
    const result = await apiRequest(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result.data;
  };

  return { createBooking, updateBooking };
}
