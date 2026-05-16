import { create } from "zustand";
import type { Booking } from "@/lib/types";
import { useCounterStore } from "./counter";

// ============================================================================
// BOOKING STORE
// ============================================================================

interface BookingStore {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "createdAt" | "updatedAt">) => Booking;
  updateBooking: (id: number, data: Partial<Booking>) => void;
  deleteBooking: (id: number) => void;
  forfeitDeposit: (id: number) => void;
  refundDeposit: (id: number) => void;
  useDeposit: (id: number) => void;
  getBookingById: (id: number) => Booking | undefined;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],

  addBooking: (bookingData) => {
    const newBooking: Booking = {
      ...bookingData,
      id: useCounterStore.getState().incrementBookingId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ bookings: [...state.bookings, newBooking] }));
    return newBooking;
  },

  updateBooking: (id, data) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, ...data } : b,
      ),
    }));
  },

  deleteBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.filter((b) => b.id !== id),
    }));
  },

  forfeitDeposit: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              depositStatus: "FORFEITED" as const,
              depositForfeitedDate: new Date(),
            }
          : b,
      ),
    }));
  },

  refundDeposit: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? { ...b, depositStatus: "NONE" as const, depositAmount: 0 }
          : b,
      ),
    }));
  },

  useDeposit: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, depositStatus: "USED" as const } : b,
      ),
    }));
  },

  getBookingById: (id) => {
    return get().bookings.find((b) => b.id === id);
  },
}));
