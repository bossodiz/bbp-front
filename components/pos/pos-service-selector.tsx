"use client";

import { useState, useMemo, useCallback } from "react";
import { Scissors, Plus, Dog, Cat, Package, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useProducts } from "@/lib/hooks/use-products";
import { petTypeLabels } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function POSServiceSelector() {
  const { products } = useProducts();
  const services = useServiceStore((s) => s.services);

  const selectedPetIds = usePOSStore((s) => s.selectedPetIds);
  const selectedCustomerId = usePOSStore((s) => s.selectedCustomerId);
  const cart = usePOSStore((s) => s.cart);
  const addToCart = usePOSStore((s) => s.addToCart);
  const customers = useCustomerStore((s) => s.customers);
  const updatePetInStore = useCustomerStore((s) => s.updatePet);
  const petTypes = useServiceConfigStore((s) => s.petTypes);
  const getSizesForPetType = useServiceConfigStore((s) => s.getSizesForPetType);

  const [showPetSelectDialog, setShowPetSelectDialog] = useState(false);
  const [pendingService, setPendingService] = useState<{
    serviceId: number;
    serviceName: string;
    price: number;
  } | null>(null);

  const [weightEditPet, setWeightEditPet] = useState<{
    id: number;
    customerId: number;
    name: string;
    type: "DOG" | "CAT";
    breed: string;
    breed2?: string;
    isMixedBreed: boolean;
    note?: string;
  } | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [isSavingWeight, setIsSavingWeight] = useState(false);

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
      if (weight === null || weight === undefined || isNaN(weight)) return null;

      const sizesForType = getSizesForPetType(petTypeId)
        .filter((s) => s.active)
        .sort((a, b) => (a.minWeight ?? 0) - (b.minWeight ?? 0));

      // Try to match based on minWeight and maxWeight
      for (const size of sizesForType) {
        const min = size.minWeight ?? 0;
        const max = size.maxWeight ?? Infinity;

        // Use >= for min and < for max to avoid gaps
        // e.g., M: 4-4.9 means 4 <= weight < 5 (includes 4.95)
        if (weight >= min && weight < max) {
          return size.id;
        }
      }

      // Fallback: return last size if weight exceeds all ranges
      return sizesForType[sizesForType.length - 1]?.id || null;
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

  const getSizeName = (sizeId: string | null | undefined) => {
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

  const getSizeName1 = (sizeId: string | null | undefined) => {
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
    sizeIdOverride?: string,
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

    const petTypeId = pet?.type ? getPetTypeIdForPet(pet.type) : "DOG";
    const petWeight = pet?.weight ?? null;
    const estSizeId =
      sizeIdOverride ?? estimateSizeFromWeight(petWeight, petTypeId);
    const sizeName = service.isSpecial ? "" : getSizeName(estSizeId);

    addToCart({
      serviceId: service.id,
      serviceName: (service.name + " " + sizeName).trim(),
      originalPrice: price,
      finalPrice: price,
      isPriceModified: false,
      petId: petId ?? null,
      petName: pet?.name ?? undefined,
      petType: pet?.type ?? undefined,
    });

    toast.success(
      `เพิ่ม "${service.name}"${pet ? ` สำหรับ ${pet.name}` : ""} ลงตะกร้าแล้ว`,
    );
  };

  const openWeightDialog = (pet: {
    id: number;
    customerId: number;
    name: string;
    type: "DOG" | "CAT";
    breed: string;
    breed2?: string;
    isMixedBreed: boolean;
    weight: number | null;
    note?: string;
  }) => {
    setWeightEditPet({
      id: pet.id,
      customerId: pet.customerId,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      breed2: pet.breed2,
      isMixedBreed: pet.isMixedBreed,
      note: pet.note,
    });
    setWeightInput(pet.weight ? String(pet.weight) : "");
  };

  const handleSaveWeight = async () => {
    if (!weightEditPet) return;

    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      toast.error("กรุณากรอกน้ำหนักที่ถูกต้อง");
      return;
    }
    if (weight > 200) {
      toast.error("น้ำหนักต้องไม่เกิน 200 kg");
      return;
    }

    setIsSavingWeight(true);
    try {
      const response = await fetch(`/api/pets/${weightEditPet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: weightEditPet.name,
          type: weightEditPet.type,
          breed: weightEditPet.breed,
          breed_2: weightEditPet.breed2 ?? null,
          is_mixed_breed: weightEditPet.isMixedBreed,
          weight,
          note: weightEditPet.note ?? null,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "ไม่สามารถบันทึกน้ำหนักได้");
      }

      updatePetInStore(weightEditPet.customerId, weightEditPet.id, { weight });
      toast.success(
        `บันทึกน้ำหนัก ${weight} kg สำหรับ ${weightEditPet.name} แล้ว`,
      );
      setWeightEditPet(null);
      setWeightInput("");
    } catch (err: any) {
      toast.error(err?.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSavingWeight(false);
    }
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
  const activeProducts = products.filter((p) => p.active);

  const handleAddProduct = (
    productId: number,
    productName: string,
    price: number,
    stockQuantity: number,
  ) => {
    const existing = cart.find(
      (item) =>
        (item.itemType || "SERVICE") === "PRODUCT" &&
        item.productId === productId,
    );
    const existingQty = existing?.quantity ?? 0;
    if (stockQuantity <= 0) {
      toast.error("สินค้าในสต็อกหมด");
      return;
    }
    if (existingQty >= stockQuantity) {
      toast.error("จำนวนสินค้าในตะกร้าเกินสต๊อก");
      return;
    }

    addToCart({
      serviceId: productId,
      serviceName: productName,
      originalPrice: price,
      finalPrice: price,
      isPriceModified: false,
      itemType: "PRODUCT",
      productId,
      quantity: 1,
      maxQuantity: stockQuantity,
      petId: null,
      petName: undefined,
      petType: undefined,
    });
  };

  // Don't show service selector if customer is not selected
  if (!selectedCustomerId) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">เลือกรายการ</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                บริการ
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                สินค้า
              </TabsTrigger>
            </TabsList>
            <TabsContent value="services">
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
                            "flex items-center justify-between gap-2 p-2 rounded-lg border",
                            pet.type === "DOG"
                              ? "bg-dog/10 border-dog/20"
                              : "bg-cat/10 border-cat/20",
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {pet.type === "DOG" ? (
                              <Dog className="h-5 w-5 text-dog shrink-0" />
                            ) : (
                              <Cat className="h-5 w-5 text-cat shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate">{pet.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {petTypeLabels[pet.type]} - {pet.breed} (
                                {pet.weight
                                  ? `${pet.weight} kg`
                                  : "ไม่ระบุน้ำหนัก"}
                                )
                                {estimatedSizeId && (
                                  <span className="ml-1">
                                    • ขนาด: {getSizeName1(estimatedSizeId)}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {/* Weight Edit Button */}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openWeightDialog(pet)}
                            className="shrink-0 gap-1.5"
                          >
                            <Scale className="h-4 w-4" />
                            <span className="text-xs">
                              {pet.weight ? "แก้ไขน้ำหนัก" : "ระบุน้ำหนัก"}
                            </span>
                          </Button>
                        </div>

                        {/* Regular Services */}
                        <div className="space-y-4">
                          {regularServices.map((service) => {
                            const availablePrices = service.prices.filter(
                              (p) =>
                                p.petTypeId === petTypeId &&
                                p.price > 0 &&
                                (!estimatedSizeId ||
                                  p.sizeId === estimatedSizeId),
                            );

                            if (availablePrices.length === 0) return null;

                            const isInCart = cart.some(
                              (item) =>
                                item.serviceId === service.id &&
                                item.petId === pet.id,
                            );

                            return (
                              <div key={service.id} className="space-y-2">
                                <h4 className="font-medium text-sm">
                                  {service.name}
                                </h4>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {availablePrices.map((priceInfo) => (
                                    <button
                                      key={`${service.id}-${priceInfo.sizeId}`}
                                      type="button"
                                      disabled={isInCart}
                                      onClick={() =>
                                        handleAddService(
                                          service.id,
                                          service.name,
                                          priceInfo.price,
                                          pet.id,
                                          priceInfo.sizeId,
                                        )
                                      }
                                      className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                                        isInCart
                                          ? "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                                          : pet.type === "DOG"
                                            ? "bg-dog/5 hover:bg-dog/10 hover:border-primary/50 cursor-pointer"
                                            : "bg-cat/5 hover:bg-cat/10 hover:border-primary/50 cursor-pointer",
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "text-xs",
                                            pet.type === "DOG"
                                              ? "border-dog/30 text-dog"
                                              : "border-cat/30 text-cat",
                                          )}
                                        >
                                          {petTypeLabels[pet.type]}
                                        </Badge>
                                        <span className="text-sm">
                                          {getSizeName(priceInfo.sizeId)}
                                          {getSizeDescription(
                                            priceInfo.sizeId,
                                          ) && (
                                            <span className="text-muted-foreground ml-1">
                                              (
                                              {getSizeDescription(
                                                priceInfo.sizeId,
                                              )}
                                              )
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <span
                                        className={cn(
                                          "font-semibold",
                                          isInCart
                                            ? "text-muted-foreground"
                                            : "",
                                        )}
                                      >
                                        {formatCurrency(priceInfo.price)}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
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
                    เลือกสัตว์เลี้ยงเพื่อดูราคาที่เหมาะสม
                    หรือเลือกบริการด้านล่าง
                  </p>

                  {/* Regular Services */}
                  <div className="space-y-4">
                    {regularServices.map((service) => {
                      const availablePrices = service.prices.filter(
                        (p) => p.price > 0,
                      );

                      if (availablePrices.length === 0) return null;

                      return (
                        <div key={service.id} className="space-y-2">
                          <h4 className="font-medium text-sm">
                            {service.name}
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {availablePrices.map((priceInfo) => (
                              <button
                                key={`${service.id}-${priceInfo.id}`}
                                type="button"
                                onClick={() =>
                                  handleAddService(
                                    service.id,
                                    service.name,
                                    priceInfo.price,
                                  )
                                }
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer hover:border-primary/50",
                                  priceInfo.petTypeId === "DOG"
                                    ? "bg-dog/5 hover:bg-dog/10"
                                    : priceInfo.petTypeId === "CAT"
                                      ? "bg-cat/5 hover:bg-cat/10"
                                      : "bg-muted/50 hover:bg-muted",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      priceInfo.petTypeId === "DOG"
                                        ? "border-dog/30 text-dog"
                                        : priceInfo.petTypeId === "CAT"
                                          ? "border-cat/30 text-cat"
                                          : "",
                                    )}
                                  >
                                    {getPetTypeName(priceInfo.petTypeId)}
                                  </Badge>
                                  <span className="text-sm">
                                    {getSizeName(priceInfo.sizeId)}
                                    {getSizeDescription(priceInfo.sizeId) && (
                                      <span className="text-muted-foreground ml-1">
                                        ({getSizeDescription(priceInfo.sizeId)})
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <span className="font-semibold">
                                  {formatCurrency(priceInfo.price)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
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
                          const price = service.specialPrice || 0;
                          if (price <= 0) return null;

                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() =>
                                handleAddService(
                                  service.id,
                                  service.name,
                                  price,
                                )
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all bg-card hover:border-primary hover:shadow-sm cursor-pointer"
                            >
                              <span className="font-medium">
                                {service.name}
                              </span>
                              <span className="font-semibold text-primary">
                                {formatCurrency(price)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="products">
              {activeProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    ไม่มีสินค้าในระบบ
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {activeProducts.map((product) => {
                    const existing = cart.find(
                      (item) =>
                        (item.itemType || "SERVICE") === "PRODUCT" &&
                        item.productId === product.id,
                    );
                    const existingQty = existing?.quantity ?? 0;
                    const outOfStock = product.stockQuantity <= 0;
                    const isMaxed =
                      !outOfStock && existingQty >= product.stockQuantity;
                    const disabled = outOfStock || isMaxed;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          handleAddProduct(
                            product.id,
                            product.name,
                            product.price,
                            product.stockQuantity,
                          )
                        }
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                          disabled
                            ? "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                            : "bg-card hover:border-primary hover:shadow-sm cursor-pointer",
                        )}
                      >
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.category && (
                            <p className="text-xs text-muted-foreground">
                              {product.category}
                            </p>
                          )}
                          <p
                            className={cn(
                              "text-lg font-semibold",
                              disabled
                                ? "text-muted-foreground"
                                : "text-primary",
                            )}
                          >
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                        {outOfStock ? (
                          <Badge variant="secondary" className="text-xs">
                            หมด
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {existingQty}/{product.stockQuantity}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
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

      {/* Weight Edit Dialog */}
      <Dialog
        open={!!weightEditPet}
        onOpenChange={(open) => {
          if (!open) {
            setWeightEditPet(null);
            setWeightInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              ระบุน้ำหนัก
            </DialogTitle>
            <DialogDescription>
              บันทึกน้ำหนักของ{" "}
              <span className="font-medium text-foreground">
                {weightEditPet?.name}
              </span>{" "}
              เพื่อคำนวณราคาบริการให้เหมาะสม
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {weightEditPet && (
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  weightEditPet.type === "DOG"
                    ? "bg-dog/10 border-dog/20"
                    : "bg-cat/10 border-cat/20",
                )}
              >
                {weightEditPet.type === "DOG" ? (
                  <Dog className="h-8 w-8 text-dog" />
                ) : (
                  <Cat className="h-8 w-8 text-cat" />
                )}
                <div>
                  <p className="font-medium">{weightEditPet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {petTypeLabels[weightEditPet.type]} - {weightEditPet.breed}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="pet-weight-input">น้ำหนัก (กิโลกรัม)</Label>
              <div className="relative">
                <Input
                  id="pet-weight-input"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="200"
                  autoFocus
                  placeholder="เช่น 5.5"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSavingWeight) {
                      e.preventDefault();
                      handleSaveWeight();
                    }
                  }}
                  className="pr-12 text-lg h-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
                  kg
                </span>
              </div>

              {/* Quick weight presets based on pet type */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground self-center mr-1">
                  เลือกเร็ว:
                </span>
                {(weightEditPet?.type === "CAT"
                  ? [2, 3, 4, 5, 6, 8]
                  : [3, 5, 10, 15, 20, 25]
                ).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeightInput(String(w))}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer",
                      weightInput === String(w)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card hover:bg-accent border-border",
                    )}
                  >
                    {w} kg
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setWeightEditPet(null);
                setWeightInput("");
              }}
              disabled={isSavingWeight}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSaveWeight}
              disabled={isSavingWeight || !weightInput}
            >
              {isSavingWeight ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
