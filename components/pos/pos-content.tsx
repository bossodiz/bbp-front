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
  useServiceConfigStore,
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
  const { petTypes, sizes, fetchPetTypes, fetchSizes } =
    useServiceConfigStore();

  // Fetch customers and services from API
  const { customers: apiCustomers, fetchCustomers } = useCustomers();
  const { services: apiServices, fetchServices } = useServices({
    autoFetch: false,
  });
  const { promotions: apiPromotions, fetchPromotions } = usePromotions();

  // Load customers, services, petTypes and sizes on mount (only once)
  useEffect(() => {
    if (!hasLoadedData.current) {
      hasLoadedData.current = true;
      fetchCustomers();
      fetchPromotions();
      fetchServices();
      fetchPetTypes();
      fetchSizes();
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

    // Wait for services, petTypes and sizes to load before processing booking
    if (
      apiServices.length === 0 ||
      petTypes.length === 0 ||
      sizes.length === 0
    ) {
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
            return;
          }
          booking = await response.json();
        }

        if (!booking) return;

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
        } else {
          customerId = existingCustomer.id;
        }

        setSelectedCustomer(customerId);

        // Handle pets from booking
        if (booking.pets && booking.pets.length > 0) {
          // Process each pet sequentially
          booking.pets.forEach((bookingPet) => {
            // Get fresh customer data (after addCustomer was called)
            const currentCustomers = useCustomerStore.getState().customers;
            const currentCustomer = currentCustomers.find(
              (c) => c.id === customerId,
            );
            if (!currentCustomer) {
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
            }

            // Select the pet
            togglePetSelection(pet.id);

            // Auto-add service from booking
            if (bookingPet.service && apiServices.length > 0) {
              // Find matching service by name (case-insensitive)
              const matchingService = apiServices.find(
                (s) =>
                  s.name.toLowerCase().trim() ===
                  bookingPet.service.toLowerCase().trim(),
              );

              if (matchingService) {
                // Map pet type to service pet type ID
                const petTypeId = pet.type; // "DOG" or "CAT"

                // Get sizes for this pet type
                const { getSizesForPetType } = useServiceConfigStore.getState();
                const sizesForType = getSizesForPetType(petTypeId).filter(
                  (s) => s.active,
                );

                // Estimate size based on weight
                let estimatedSizeId: string | null = null;
                if (pet.weight && sizesForType.length > 0) {
                  for (const size of sizesForType) {
                    const min = size.minWeight ?? 0;
                    const max = size.maxWeight ?? Infinity;
                    if (pet.weight >= min && pet.weight <= max) {
                      estimatedSizeId = size.id;
                      break;
                    }
                  }
                  // Fallback to first size if no match
                  if (!estimatedSizeId) {
                    estimatedSizeId = sizesForType[0]?.id || null;
                  }
                }

                // Find price for this pet type and size
                let servicePrice = 0;
                if (matchingService.isSpecial) {
                  servicePrice = matchingService.specialPrice || 0;
                } else {
                  const priceInfo = matchingService.prices.find(
                    (p) =>
                      p.petTypeId === petTypeId &&
                      (!estimatedSizeId || p.sizeId === estimatedSizeId),
                  );
                  servicePrice = priceInfo?.price || 0;
                }

                // Add to cart if price is valid
                if (servicePrice > 0) {
                  addToCart({
                    serviceId: matchingService.id,
                    serviceName: matchingService.name,
                    originalPrice: servicePrice,
                    finalPrice: servicePrice,
                    isPriceModified: false,
                    petId: pet.id,
                    petName: pet.name,
                    petType: pet.type,
                  });
                }
              }
            }
          });
        }
      } catch (error) {
        // Error loading booking
      } finally {
        setLoadingBooking(false);
      }
    };

    loadAndProcessBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, apiServices.length, petTypes.length, sizes.length]);

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
