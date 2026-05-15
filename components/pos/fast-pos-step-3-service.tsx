"use client";

import { useState, useEffect, useCallback } from "react";
import { Dog, Cat, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useFastPOS,
  getSelectedPets,
  estimateSizeId,
  FastPOSServiceSelection,
} from "./fast-pos-context";

interface ServicePrice {
  id: number;
  petTypeId?: string;
  sizeId?: string;
  price: number;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  isSpecial: boolean;
  specialPrice?: number;
  active: boolean;
  order: number;
  prices: ServicePrice[];
}

interface SizeConfig {
  id: string;
  name: string;
  minWeight?: number;
  maxWeight?: number;
}

export function FastPOSStep3Service() {
  const {
    state,
    setServicesForPet,
    clearServicesForPet,
    setCurrentPetIndexForService,
    nextStep,
    prevStep,
  } = useFastPOS();

  const selectedPets = getSelectedPets(state.pets);
  const currentPetIdx = state.currentPetIndexForService;
  const currentPet = selectedPets[currentPetIdx];

  const [services, setServices] = useState<Service[]>([]);
  const [sizes, setSizes] = useState<SizeConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // Per-pet selected service IDs for UI
  const currentPetGlobalIndex = state.pets.indexOf(currentPet);
  const currentSelections = state.selectedServices.filter(
    (s) => s.petIndex === currentPetGlobalIndex,
  );

  // Fetch services + sizes on mount / pet change
  useEffect(() => {
    if (!currentPet) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [svcRes, sizeRes] = await Promise.all([
          fetch("/api/services?active=true"),
          fetch(`/api/config/pet-sizes?petTypeId=${currentPet.type}`),
        ]);

        if (svcRes.ok) {
          const json = await svcRes.json();
          const list: Service[] = (json.data ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            isSpecial: s.is_special ?? s.isSpecial ?? false,
            specialPrice: s.special_price ?? s.specialPrice ?? undefined,
            active: s.active,
            order: s.order ?? s.order_index ?? 0,
            prices: (s.service_prices ?? s.prices ?? []).map((p: any) => ({
              id: p.id,
              petTypeId: p.pet_type_id ?? p.petTypeId,
              sizeId: p.size_id ?? p.sizeId,
              price: p.price,
            })),
          }));
          setServices(list.filter((s) => s.active).sort((a, b) => a.order - b.order));
        }

        if (sizeRes.ok) {
          const json = await sizeRes.json();
          const list: SizeConfig[] = (json.data ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
            minWeight: s.min_weight ?? s.minWeight ?? undefined,
            maxWeight: s.max_weight ?? s.maxWeight ?? undefined,
          }));
          setSizes(list);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPet?.type, currentPetIdx]);

  const estimatedSizeId = currentPet?.weight
    ? estimateSizeId(currentPet.weight, sizes)
    : null;

  const getSizeName = (sizeId: string | null) =>
    sizes.find((s) => s.id === sizeId)?.name ?? sizeId ?? "?";

  const getPriceForService = useCallback(
    (service: Service): { price: number; sizeId: string | null } | null => {
      if (!currentPet) return null;

      if (service.isSpecial) {
        return { price: service.specialPrice ?? 0, sizeId: null };
      }

      const petPrices = service.prices.filter(
        (p) => !p.petTypeId || p.petTypeId === currentPet.type,
      );

      if (petPrices.length === 0) return null;

      if (estimatedSizeId) {
        const match = petPrices.find((p) => p.sizeId === estimatedSizeId);
        if (match) return { price: match.price, sizeId: estimatedSizeId };
      }

      // Fallback: first price
      const first = petPrices[0];
      return { price: first.price, sizeId: first.sizeId ?? null };
    },
    [currentPet, estimatedSizeId],
  );

  const isServiceSelected = (serviceId: number) =>
    currentSelections.some((s) => s.serviceId === serviceId);

  const toggleService = (service: Service) => {
    if (!currentPet) return;
    const priceInfo = getPriceForService(service);
    if (!priceInfo) return;

    const globalIdx = currentPetGlobalIndex;

    if (isServiceSelected(service.id)) {
      // deselect
      const updated = currentSelections.filter((s) => s.serviceId !== service.id);
      setServicesForPet(globalIdx, updated);
    } else {
      // select
      const newSelection: FastPOSServiceSelection = {
        petIndex: globalIdx,
        petId: currentPet.id,
        petName: currentPet.name,
        petType: currentPet.type,
        serviceId: service.id,
        serviceName: service.name,
        sizeId: priceInfo.sizeId ?? undefined,
        price: priceInfo.price,
      };
      setServicesForPet(globalIdx, [...currentSelections, newSelection]);
    }
  };

  const handleNextPet = () => {
    if (currentPetIdx < selectedPets.length - 1) {
      setCurrentPetIndexForService(currentPetIdx + 1);
    } else {
      nextStep();
    }
  };

  const handlePrevPet = () => {
    if (currentPetIdx > 0) {
      setCurrentPetIndexForService(currentPetIdx - 1);
    } else {
      prevStep();
    }
  };

  const hasServiceSelected = currentSelections.length > 0;
  const isLastPet = currentPetIdx === selectedPets.length - 1;

  if (!currentPet) return null;

  return (
    <div className="space-y-4">
      {/* Pet context header */}
      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          {currentPet.type === "DOG" ? (
            <Dog className="h-4 w-4 text-dog" />
          ) : (
            <Cat className="h-4 w-4 text-cat" />
          )}
          <span className="font-medium text-sm">{currentPet.name}</span>
          <span className="text-xs text-muted-foreground">
            {currentPet.weight ? `${currentPet.weight} kg` : "ไม่ระบุน้ำหนัก"}
          </span>
          {estimatedSizeId && (
            <Badge variant="outline" className="text-xs">
              ขนาด {getSizeName(estimatedSizeId)}
            </Badge>
          )}
        </div>

        {selectedPets.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPetIdx === 0}
              onClick={() => setCurrentPetIndexForService(currentPetIdx - 1)}
              className="disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">
              {currentPetIdx + 1}/{selectedPets.length}
            </span>
            <button
              type="button"
              disabled={currentPetIdx === selectedPets.length - 1}
              onClick={() => setCurrentPetIndexForService(currentPetIdx + 1)}
              className="disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Services list */}
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          กำลังโหลดบริการ...
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
          {services.map((service) => {
            const priceInfo = getPriceForService(service);
            const unavailable = !priceInfo;
            const selected = isServiceSelected(service.id);

            return (
              <button
                key={service.id}
                type="button"
                disabled={unavailable}
                onClick={() => toggleService(service)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors",
                  unavailable
                    ? "cursor-not-allowed opacity-40 bg-muted/20"
                    : selected
                      ? "border-primary/40 bg-primary/8"
                      : "border-border hover:bg-accent/30",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : unavailable
                          ? "border-muted"
                          : "border-muted-foreground",
                    )}
                  >
                    {selected && (
                      <svg
                        className="h-2.5 w-2.5"
                        fill="currentColor"
                        viewBox="0 0 12 12"
                      >
                        <path d="M10 3L5 8L2 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    {priceInfo?.sizeId && (
                      <p className="text-xs text-muted-foreground">
                        ขนาด {getSizeName(priceInfo.sizeId)}
                      </p>
                    )}
                    {unavailable && (
                      <p className="text-xs text-muted-foreground">
                        ไม่มีบริการนี้สำหรับประเภทนี้
                      </p>
                    )}
                  </div>
                </div>

                {priceInfo && (
                  <span
                    className={cn(
                      "text-sm font-semibold shrink-0 ml-2",
                      selected ? "text-primary" : "text-foreground",
                    )}
                  >
                    ฿{priceInfo.price.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!hasServiceSelected && !loading && (
        <p className="text-xs text-center text-muted-foreground">
          เลือกอย่างน้อย 1 บริการสำหรับ {currentPet.name}
        </p>
      )}

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={handlePrevPet}>
          ← ย้อนกลับ
        </Button>
        <Button onClick={handleNextPet} disabled={!hasServiceSelected}>
          {isLastPet
            ? "ตรวจสอบ →"
            : `ถัดไป: ${selectedPets[currentPetIdx + 1]?.name} →`}
        </Button>
      </div>
    </div>
  );
}
