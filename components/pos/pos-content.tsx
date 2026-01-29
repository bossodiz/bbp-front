"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { POSServiceSelector } from "./pos-service-selector";
import { POSCart } from "./pos-cart";
import { POSCustomerSelector } from "./pos-customer-selector";
import {
  usePOSStore,
  useBookingStore,
  useCustomerStore,
  useServiceStore,
  usePromotionStore,
} from "@/lib/store";
import { useCustomers } from "@/lib/hooks/use-customers";
import { useServices } from "@/lib/hooks/use-services";
import { usePromotions } from "@/lib/hooks/use-promotions";
import type { Booking } from "@/lib/types";

export function POSContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [loadingBooking, setLoadingBooking] = useState(false);
  const hasLoadedData = useRef(false);
  const hasLoadedBooking = useRef<string | null>(null);

  const {
    setSelectedBooking,
    setSelectedCustomer,
    togglePetSelection,
    addToCart,
    resetPOS,
  } = usePOSStore();
  const { getBookingById } = useBookingStore();
  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const addPet = useCustomerStore((state) => state.addPet);
  const setCustomers = useCustomerStore((state) => state.customers);
  const { services } = useServiceStore();
  const setServices = useServiceStore((state) => state.services);

  // Fetch customers and services from API
  const { customers: apiCustomers, fetchCustomers } = useCustomers();
  const { services: apiServices, fetchServices } = useServices({
    autoFetch: false,
  });
  const { promotions: apiPromotions, fetchPromotions } = usePromotions();

  // Load customers and services on mount (only once)
  useEffect(() => {
    if (!hasLoadedData.current) {
      hasLoadedData.current = true;
      fetchCustomers();
      fetchPromotions();
      fetchServices();
    }
  }, []);

  // Sync API data to stores
  useEffect(() => {
    if (apiCustomers.length > 0) {
      // Sync customers to local store
      useCustomerStore.setState({ customers: apiCustomers });
    }
  }, [apiCustomers]);

  useEffect(() => {
    if (apiServices.length > 0) {
      // Sync services to local store
      useServiceStore.setState({ services: apiServices });
    }
  }, [apiServices]);

  useEffect(() => {
    if (apiPromotions.length > 0) {
      // Sync promotions to local store
      usePromotionStore.setState({ promotions: apiPromotions });
    }
  }, [apiPromotions]);

  useEffect(() => {
    // Reset POS when component mounts without booking
    if (!bookingId) {
      resetPOS();
      hasLoadedBooking.current = null;
      return;
    }

    // Prevent loading the same booking twice
    if (hasLoadedBooking.current === bookingId) {
      return;
    }

    // Wait for services to load before processing booking
    if (apiServices.length === 0) {
      return;
    }

    // Mark this booking as being loaded
    hasLoadedBooking.current = bookingId;

    // Load booking data from API or local store
    const loadAndProcessBooking = async () => {
      setLoadingBooking(true);
      try {
        // Try local store first
        let booking = getBookingById(Number(bookingId));

        // If not in local store, fetch from API
        if (!booking) {
          const response = await fetch(`/api/bookings/${bookingId}`);
          if (!response.ok) {
            console.error("Failed to fetch booking");
            return;
          }
          booking = await response.json();
        }

        if (!booking) return;

        console.log("Loading booking:", booking);

        setSelectedBooking(booking.id);

        // Find or create customer
        let customerId: number;
        let existingCustomer = customers.find((c) => c.phone === booking.phone);
        if (!existingCustomer) {
          // Create new customer from booking data
          const newCustomer = addCustomer({
            name: booking.customerName,
            phone: booking.phone,
          });
          customerId = newCustomer.id;
          console.log("Created new customer:", newCustomer);
        } else {
          customerId = existingCustomer.id;
          console.log("Found existing customer:", existingCustomer);
        }

        setSelectedCustomer(customerId);

        // Handle pets from booking
        if (booking.pets && booking.pets.length > 0) {
          // Process each pet sequentially
          booking.pets.forEach((bookingPet) => {
            console.log("Processing pet:", bookingPet);

            // Get fresh customer data (after addCustomer was called)
            const currentCustomers = useCustomerStore.getState().customers;
            const currentCustomer = currentCustomers.find(
              (c) => c.id === customerId,
            );
            if (!currentCustomer) {
              console.log("Customer not found after creation");
              return;
            }

            // Try to find existing pet by name and type
            let pet = currentCustomer.pets.find(
              (p) => p.name === bookingPet.name && p.type === bookingPet.type,
            );

            // Create pet if not exists
            if (!pet) {
              pet = addPet(customerId, {
                name: bookingPet.name,
                type: bookingPet.type,
                breed: bookingPet.breed,
                isMixedBreed: false,
                weight: 5, // Default weight, should be adjusted
                note: `สร้างจากการนัดหมาย - บริการ: ${bookingPet.service}`,
              });
              console.log("Created new pet:", pet);
            } else {
              console.log("Found existing pet:", pet);
            }

            // Select the pet
            togglePetSelection(pet.id);

            // Note: Auto-add service is disabled - user will manually select services
            console.log(
              `Pet ${pet.name} selected for booking service: ${bookingPet.service}`,
            );
          });
        }
      } catch (error) {
        console.error("Error loading booking:", error);
      } finally {
        setLoadingBooking(false);
      }
    };

    loadAndProcessBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, apiServices.length]);

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
