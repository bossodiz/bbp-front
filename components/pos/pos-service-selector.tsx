"use client";

import { Scissors, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const { petTypes, sizes } = useServiceConfigStore();
  const { addToCart, selectedPetId, selectedCustomerId } = usePOSStore();
  const { customers } = useCustomerStore();

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedPet = selectedCustomer?.pets.find((p) => p.id === selectedPetId);

  // Estimate size based on weight for the selected pet
  const estimateSizeFromWeight = (weight: number): string | null => {
    const sortedSizes = [...sizes].sort((a, b) => a.order - b.order);
    // Try to match based on description if it contains weight ranges
    for (const size of sortedSizes) {
      if (size.description) {
        // Parse description like "2-5kg" or "10kg+"
        const match = size.description.match(/(\d+(?:\.\d+)?)\s*-?\s*(\d+(?:\.\d+)?)?/);
        if (match) {
          const min = parseFloat(match[1]);
          const max = match[2] ? parseFloat(match[2]) : Infinity;
          if (weight >= min && weight <= max) {
            return size.id;
          }
        }
      }
    }
    // Fallback: estimate based on order
    if (weight <= 2) return sortedSizes[0]?.id || null;
    if (weight <= 5) return sortedSizes[1]?.id || sortedSizes[0]?.id || null;
    if (weight <= 10) return sortedSizes[2]?.id || sortedSizes[1]?.id || null;
    if (weight <= 20) return sortedSizes[3]?.id || sortedSizes[2]?.id || null;
    return sortedSizes[sortedSizes.length - 1]?.id || null;
  };

  const estimatedSizeId = selectedPet
    ? estimateSizeFromWeight(selectedPet.weight)
    : null;

  const getPetTypeName = (petTypeId: string) => {
    const pt = petTypes.find((p) => p.id === petTypeId);
    return pt?.name || petTypeLabels[petTypeId as keyof typeof petTypeLabels] || petTypeId;
  };

  const getSizeName = (sizeId: string) => {
    const s = sizes.find((sz) => sz.id === sizeId);
    return s?.name || sizeId;
  };

  const getSizeDescription = (sizeId: string) => {
    const s = sizes.find((sz) => sz.id === sizeId);
    return s?.description || "";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddService = (serviceId: number, price: number) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    addToCart({
      serviceId: service.id,
      serviceName: service.name,
      originalPrice: price,
      finalPrice: price,
      isPriceModified: false,
    });

    toast.success(`เพิ่ม "${service.name}" ลงตะกร้าแล้ว`);
  };

  // Map pet type (DOG/CAT from Pet) to service pet type ID
  const getPetTypeIdForPet = (petType: "DOG" | "CAT") => {
    // First try exact match
    const exact = petTypes.find((p) => p.id === petType);
    if (exact) return exact.id;
    // Fallback
    return petType;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          เลือกบริการ
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedPet && estimatedSizeId ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              แสดงราคาสำหรับ {petTypeLabels[selectedPet.type]} ขนาด
              {getSizeName(estimatedSizeId)} ({selectedPet.weight} kg)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const petTypeId = getPetTypeIdForPet(selectedPet.type);
                const priceInfo = service.prices.find(
                  (p) => p.petTypeId === petTypeId && p.sizeId === estimatedSizeId
                );

                if (!priceInfo || priceInfo.price <= 0) return null;

                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(priceInfo.price)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddService(service.id, priceInfo.price)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      เพิ่ม
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              เลือกลูกค้าและสัตว์เลี้ยงเพื่อดูราคาที่เหมาะสม หรือเลือกบริการด้านล่าง
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
                        onClick={() => handleAddService(service.id, price.price)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border text-left hover:border-primary/50 transition-colors",
                          price.petTypeId === "DOG"
                            ? "bg-dog/5 hover:bg-dog/10"
                            : price.petTypeId === "CAT"
                              ? "bg-cat/5 hover:bg-cat/10"
                              : "bg-muted/50 hover:bg-muted"
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
                                  : ""
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
  );
}
