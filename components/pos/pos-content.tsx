"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { POSServiceSelector } from "./pos-service-selector";
import { POSCart } from "./pos-cart";
import { POSCustomerSelector } from "./pos-customer-selector";
import {
  usePOSStore,
  useBookingStore,
  useCustomerStore,
  useServiceStore,
  useServiceConfigStore,
} from "@/lib/store";
import { fetchAllPOSData } from "@/lib/utils/fetch-pos-data";

export function POSContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const hotelId = searchParams.get("hotelId");

  const hasLoadedBooking = useRef<string | null>(null);
  const hasResetForBooking = useRef<string | null>(null);
  const hasLoadedHotel = useRef<string | null>(null);
  const dataPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Load all POS data on mount (reuse same promise across Strict Mode remounts)
      if (!dataPromise.current) {
        dataPromise.current = fetchAllPOSData();
      }
      await dataPromise.current;

      if (cancelled) return;

      // --- Hotel flow (URL param hotelId) ---
      if (hotelId) {
        if (hasLoadedHotel.current === hotelId) return;

        usePOSStore.getState().resetPOS();
        hasLoadedBooking.current = null;
        hasResetForBooking.current = null;

        try {
          const response = await fetch(`/api/hotel/${hotelId}`);
          if (!response.ok || cancelled) return;
          const result = await response.json();
          const hotel = result.data;
          if (!hotel || cancelled) return;

          hasLoadedHotel.current = hotelId;
          usePOSStore.getState().setHotelBooking(hotel.customerId, hotel.id);
        } catch {
          // Error loading hotel booking
        }
        return;
      }

      // Not hotel flow — clear hotel ref
      hasLoadedHotel.current = null;

      // --- Booking flow (URL param bookingId) ---
      if (bookingId) {
        if (hasLoadedBooking.current === bookingId) return;

        if (hasResetForBooking.current !== bookingId) {
          hasResetForBooking.current = bookingId;
          usePOSStore.getState().resetPOS();
        }

        hasLoadedBooking.current = bookingId;

        try {
          const getBookingById = useBookingStore.getState().getBookingById;
          let booking = getBookingById(Number(bookingId));

          if (!booking) {
            const response = await fetch(`/api/bookings/${bookingId}`);
            if (!response.ok || cancelled) return;
            booking = await response.json();
          }

          if (!booking || cancelled) return;

          usePOSStore.getState().setSelectedBooking(booking.id);

          const customerId = booking.customerId;

          const customers = useCustomerStore.getState().customers;
          let existingCustomer = customers.find((c) => c.id === customerId);
          if (!existingCustomer && booking.customerName && booking.phone) {
            // Add customer to local store with correct database ID
            // (customerName and phone come from customers table via join)
            useCustomerStore.setState((state: any) => ({
              customers: [
                ...state.customers,
                {
                  id: customerId,
                  name: booking.customerName,
                  phone: booking.phone,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  pets: [],
                },
              ],
            }));
          }

          usePOSStore.getState().setSelectedCustomer(customerId);

          // Handle pets from booking
          if (booking.pets && booking.pets.length > 0) {
            // Process each pet sequentially
            booking.pets.forEach((bookingPet: any) => {
              // Get fresh customer data (after syncing customer)
              const currentCustomers = useCustomerStore.getState().customers;
              const services = useServiceStore.getState().services;
              const currentCustomer = currentCustomers.find(
                (c) => c.id === customerId,
              );
              if (!currentCustomer) {
                return;
              }

              // Try to find existing pet by ID from booking, or by name and type
              let pet = currentCustomer.pets.find(
                (p) => p.id === bookingPet.petId,
              );

              if (!pet) {
                pet = currentCustomer.pets.find(
                  (p) =>
                    p.name === bookingPet.name && p.type === bookingPet.type,
                );
              }

              // Create or sync pet with correct database ID
              if (!pet) {
                // Add pet to local store with correct database ID
                const newPet = {
                  id: bookingPet.petId,
                  customerId: customerId,
                  name: bookingPet.name,
                  type: bookingPet.type,
                  breed: bookingPet.breed,
                  isMixedBreed: false,
                  weight: bookingPet.weight || 5,
                  note: `สร้างจากการนัดหมาย - บริการ: ${bookingPet.service}`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };

                useCustomerStore.setState((state) => ({
                  customers: state.customers.map((c) =>
                    c.id === customerId
                      ? {
                          ...c,
                          pets: [...c.pets, newPet],
                          updatedAt: new Date(),
                        }
                      : c,
                  ),
                }));

                pet = newPet;
              } else if (pet.id !== bookingPet.petId) {
                // Update pet ID to match database
                useCustomerStore.setState((state) => ({
                  customers: state.customers.map((c) =>
                    c.id === customerId
                      ? {
                          ...c,
                          pets: c.pets.map((p) =>
                            p.name === bookingPet.name &&
                            p.type === bookingPet.type
                              ? {
                                  ...p,
                                  id: bookingPet.petId,
                                  weight: bookingPet.weight || p.weight,
                                }
                              : p,
                          ),
                          updatedAt: new Date(),
                        }
                      : c,
                  ),
                }));

                pet = {
                  ...pet,
                  id: bookingPet.petId,
                  weight: bookingPet.weight || pet.weight,
                };
              }

              // Select the pet
              usePOSStore.getState().togglePetSelection(pet.id);

              // Auto-add service from booking
              if (bookingPet.service && services.length > 0) {
                // Find matching service by name (case-insensitive)
                const matchingService = services.find(
                  (s) =>
                    s.name.toLowerCase().trim() ===
                    bookingPet.service.toLowerCase().trim(),
                );

                if (matchingService) {
                  // Map pet type to service pet type ID
                  const petTypeId = pet.type; // "DOG" or "CAT"

                  // Get sizes for this pet type
                  const { getSizesForPetType } =
                    useServiceConfigStore.getState();
                  const sizesForType = getSizesForPetType(petTypeId).filter(
                    (s) => s.active,
                  );

                  // Estimate size based on weight
                  let estimatedSizeId: string | null = null;
                  if (pet.weight && sizesForType.length > 0) {
                    // Sort sizes by minWeight
                    const sortedSizes = [...sizesForType].sort(
                      (a, b) => (a.minWeight ?? 0) - (b.minWeight ?? 0),
                    );

                    for (const size of sortedSizes) {
                      const min = size.minWeight ?? 0;
                      const max = size.maxWeight ?? Infinity;
                      // Use >= for min and < for max to avoid gaps
                      if (pet.weight >= min && pet.weight < max) {
                        estimatedSizeId = size.id;
                        break;
                      }
                    }
                    // Fallback to last size if weight exceeds all ranges
                    if (!estimatedSizeId) {
                      estimatedSizeId =
                        sortedSizes[sortedSizes.length - 1]?.id || null;
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
                    usePOSStore.getState().addToCart({
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
        }
        return;
      }

      // --- No URL params: reset everything ---
      usePOSStore.getState().resetPOS();
      hasLoadedBooking.current = null;
      hasResetForBooking.current = null;
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, hotelId]);

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
