"use client";

import { useState, useMemo, useCallback } from "react";
import { Scissors, Plus, Dog, Cat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useServiceStore,
  usePOSStore,
  useCustomerStore,
  useServiceConfigStore,
} from "@/lib/store";
import { petTypeLabels } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function POSServiceSelector() {
  const { services } = useServiceStore();
  const { petTypes, getSizesForPetType } = useServiceConfigStore();
  const { addToCart, selectedPetIds, selectedCustomerId, cart } = usePOSStore();
  const { customers } = useCustomerStore();
  const [showPetSelectDialog, setShowPetSelectDialog] = useState(false);
  const [pendingService, setPendingService] = useState<{
    serviceId: number;
    serviceName: string;
    price: number;
  } | null>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const selectedPets = useMemo(() => {
    return (
      selectedCustomer?.pets.filter((p) => selectedPetIds.includes(p.id)) || []
    );
  }, [selectedCustomer, selectedPetIds]);

  // Estimate size based on weight for the selected pet
  const estimateSizeFromWeight = useCallback(
    (weight: number | null, petTypeId: string): string | null => {
      // If weight is null, return null to indicate no filtering by weight
      if (weight === null || weight === undefined) return null;

      const sizesForType = getSizesForPetType(petTypeId).filter(
        (s) => s.active,
      );
      // Try to match based on minWeight and maxWeight
      for (const size of sizesForType) {
        const min = size.minWeight ?? 0;
        const max = size.maxWeight ?? Infinity;

        if (weight >= min && weight <= max) {
          return size.id;
        }
      }

      // Fallback: return first size if no match
      return sizesForType[0]?.id || null;
    },
    [getSizesForPetType],
  );

  const getPetTypeName = (petTypeId: string | undefined) => {
    if (!petTypeId) return "";
    const pt = petTypes.find((p) => p.id === petTypeId);
    return (
      pt?.name ||
      petTypeLabels[petTypeId as keyof typeof petTypeLabels] ||
      petTypeId
    );
  };

  const getSizeName = (sizeId: string | undefined) => {
    if (!sizeId) return "";
    // Search in all sizes
    const allPetTypes = petTypes;
    for (const petType of allPetTypes) {
      const sizes = getSizesForPetType(petType.id);
      const s = sizes.find((sz) => sz.id === sizeId);
      if (s) return s.name;
    }
    return sizeId;
  };

  const getSizeDescription = (sizeId: string | undefined) => {
    if (!sizeId) return "";
    // Search in all sizes
    const allPetTypes = petTypes;
    for (const petType of allPetTypes) {
      const sizes = getSizesForPetType(petType.id);
      const s = sizes.find((sz) => sz.id === sizeId);
      if (s) return s.description || "";
    }
    return "";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddService = (
    serviceId: number,
    serviceName: string,
    price: number,
    petId?: number,
  ) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    // If no pet specified and we have selected pets, show dialog
    if (!petId && selectedPets.length > 0) {
      setPendingService({ serviceId, serviceName, price });
      setShowPetSelectDialog(true);
      return;
    }

    // Get pet info if petId is provided
    const pet = petId ? selectedPets.find((p) => p.id === petId) : undefined;

    const petTypeId = getPetTypeIdForPet(pet?.type);
    const petWeight = pet?.weight;
    const estSizeId = estimateSizeFromWeight(petWeight, petTypeId);
    const sizeName = service.isSpecial ? "" : getSizeName(estSizeId);

    addToCart({
      serviceId: service.id,
      serviceName: (service.name + " " + sizeName).trim(),
      originalPrice: price,
      finalPrice: price,
      isPriceModified: false,
      petId: petId || null,
      petName: pet?.name,
      petType: pet?.type,
    });

    toast.success(
      `เพิ่ม "${service.name}"${pet ? ` สำหรับ ${pet.name}` : ""} ลงตะกร้าแล้ว`,
    );
  };

  const handleSelectPetForService = (petId: number) => {
    if (pendingService) {
      handleAddService(
        pendingService.serviceId,
        pendingService.serviceName,
        pendingService.price,
        petId,
      );
      setShowPetSelectDialog(false);
      setPendingService(null);
    }
  };

  // Map pet type (DOG/CAT from Pet) to service pet type ID
  const getPetTypeIdForPet = (petType: "DOG" | "CAT") => {
    // First try exact match
    const exact = petTypes.find((p) => p.id === petType);
    if (exact) return exact.id;
    // Fallback
    return petType;
  };

  // Separate services into regular and special
  const regularServices = services.filter((s) => !s.isSpecial && s.active);
  const specialServices = services.filter((s) => s.isSpecial && s.active);

  // Don't show service selector if customer and pets are not selected
  if (!selectedCustomerId || selectedPets.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            เลือกบริการ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPets.length > 0 ? (
            <div className="space-y-4">
              {selectedPets.map((pet) => {
                const petTypeId = getPetTypeIdForPet(pet.type);
                const estimatedSizeId = estimateSizeFromWeight(
                  pet.weight,
                  petTypeId,
                );

                return (
                  <div key={pet.id} className="space-y-3">
                    <div
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border",
                        pet.type === "DOG"
                          ? "bg-dog/10 border-dog/20"
                          : "bg-cat/10 border-cat/20",
                      )}
                    >
                      {pet.type === "DOG" ? (
                        <Dog className="h-5 w-5 text-dog" />
                      ) : (
                        <Cat className="h-5 w-5 text-cat" />
                      )}
                      <div>
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {petTypeLabels[pet.type]} - {pet.breed} (
                          {pet.weight ? `${pet.weight} kg` : "ไม่ระบุน้ำหนัก"})
                          {estimatedSizeId && (
                            <span className="ml-1">
                              • ขนาด: {getSizeName(estimatedSizeId)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Regular Services */}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {regularServices.map((service) => {
                        const priceInfo = service.prices.find(
                          (p) =>
                            p.petTypeId === petTypeId &&
                            (!estimatedSizeId || p.sizeId === estimatedSizeId),
                        );

                        if (!priceInfo || priceInfo.price <= 0) return null;

                        // Check if this service+pet combination is already in cart
                        const isInCart = cart.some(
                          (item) =>
                            item.serviceId === service.id &&
                            item.petId === pet.id,
                        );

                        return (
                          <button
                            key={service.id}
                            type="button"
                            disabled={isInCart}
                            onClick={() =>
                              handleAddService(
                                service.id,
                                service.name,
                                priceInfo.price,
                                pet.id,
                              )
                            }
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                              isInCart
                                ? "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                                : "bg-card hover:border-primary hover:shadow-sm cursor-pointer",
                            )}
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {service.name} {getSizeName(estimatedSizeId)}
                              </p>
                              <p
                                className={cn(
                                  "text-lg font-semibold",
                                  isInCart
                                    ? "text-muted-foreground"
                                    : "text-primary",
                                )}
                              >
                                {formatCurrency(priceInfo.price)}
                              </p>
                            </div>
                            {isInCart && (
                              <Badge variant="secondary" className="text-xs">
                                เลือกแล้ว
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Special Services Section */}
                    {specialServices.length > 0 && (
                      <div className="space-y-2 border-t pt-3 mt-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          บริการพิเศษ
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {specialServices.map((service) => {
                            // Check if this service+pet combination is already in cart
                            const isInCart = cart.some(
                              (item) =>
                                item.serviceId === service.id &&
                                item.petId === pet.id,
                            );

                            const price = service.specialPrice || 0;
                            if (price <= 0) return null;

                            return (
                              <button
                                key={service.id}
                                type="button"
                                disabled={isInCart}
                                onClick={() =>
                                  handleAddService(
                                    service.id,
                                    service.name,
                                    price,
                                    pet.id,
                                  )
                                }
                                className={cn(
                                  "inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all",
                                  isInCart
                                    ? "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                                    : "bg-card hover:border-primary hover:shadow-sm cursor-pointer",
                                )}
                              >
                                <span className="font-medium">
                                  {service.name}
                                </span>
                                <span
                                  className={cn(
                                    "font-semibold",
                                    isInCart
                                      ? "text-muted-foreground"
                                      : "text-primary",
                                  )}
                                >
                                  {formatCurrency(price)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                เลือกลูกค้าและสัตว์เลี้ยงเพื่อดูราคาที่เหมาะสม
                หรือเลือกบริการด้านล่าง
              </p>
              {services.map((service) => (
                <div key={service.id} className="space-y-2">
                  <h4 className="font-medium">{service.name}</h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {service.prices
                      .filter((price) => price.price > 0)
                      .map((price) => (
                        <button
                          type="button"
                          key={price.id}
                          onClick={() =>
                            handleAddService(
                              service.id,
                              service.name,
                              price.price,
                            )
                          }
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border text-left hover:border-primary/50 transition-colors",
                            price.petTypeId === "DOG"
                              ? "bg-dog/5 hover:bg-dog/10"
                              : price.petTypeId === "CAT"
                                ? "bg-cat/5 hover:bg-cat/10"
                                : "bg-muted/50 hover:bg-muted",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                price.petTypeId === "DOG"
                                  ? "border-dog/30 text-dog"
                                  : price.petTypeId === "CAT"
                                    ? "border-cat/30 text-cat"
                                    : "",
                              )}
                            >
                              {getPetTypeName(price.petTypeId)}
                            </Badge>
                            <span className="text-sm">
                              {getSizeName(price.sizeId)}
                              {getSizeDescription(price.sizeId) && (
                                <span className="text-muted-foreground ml-1">
                                  ({getSizeDescription(price.sizeId)})
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(price.price)}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pet Selection Dialog */}
      <Dialog open={showPetSelectDialog} onOpenChange={setShowPetSelectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เลือกสัตว์เลี้ยง</DialogTitle>
            <DialogDescription>
              เลือกสัตว์เลี้ยงที่ต้องการให้บริการ {pendingService?.serviceName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selectedPets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() => handleSelectPetForService(pet.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left hover:bg-accent cursor-pointer",
                  pet.type === "DOG" ? "border-dog/20" : "border-cat/20",
                )}
              >
                {pet.type === "DOG" ? (
                  <Dog className="h-6 w-6 text-dog" />
                ) : (
                  <Cat className="h-6 w-6 text-cat" />
                )}
                <div>
                  <p className="font-medium">{pet.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {petTypeLabels[pet.type]} - {pet.breed} (
                    {pet.weight ? `${pet.weight} kg` : "ไม่ระบุน้ำหนัก"})
                  </p>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPetSelectDialog(false)}
            >
              ยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
