"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { POSServiceSelector } from "./pos-service-selector";
import { POSCart } from "./pos-cart";
import { POSCustomerSelector } from "./pos-customer-selector";
import { usePOSStore, useBookingStore, useCustomerStore } from "@/lib/store";

export function POSContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const {
    setSelectedBooking,
    setSelectedCustomer,
    togglePetSelection,
    resetPOS,
  } = usePOSStore();
  const { getBookingById } = useBookingStore();
  const { customers } = useCustomerStore();

  useEffect(() => {
    // Reset POS when component mounts without booking
    if (!bookingId) {
      resetPOS();
      return;
    }

    // Load booking data if bookingId is provided
    const booking = getBookingById(Number(bookingId));
    if (booking) {
      setSelectedBooking(booking.id);

      // Try to find matching customer by phone
      const customer = customers.find((c) => c.phone === booking.phone);
      if (customer) {
        setSelectedCustomer(customer.id);
        // Select first pet of matching type if available
        const pet = customer.pets.find((p) => p.type === booking.petType);
        if (pet) {
          togglePetSelection(pet.id);
        }
      }
    }
  }, [
    bookingId,
    getBookingById,
    customers,
    setSelectedBooking,
    setSelectedCustomer,
    togglePetSelection,
    resetPOS,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          ขายหน้าร้าน (POS)
        </h1>
        <p className="text-muted-foreground">เลือกบริการและชำระเงิน</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <POSCustomerSelector />
          <POSServiceSelector />
        </div>
        <div className="lg:col-span-1">
          <POSCart />
        </div>
      </div>
    </div>
  );
}
