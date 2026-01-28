"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dog, Cat } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useServices } from "@/lib/hooks/use-services";
import { useServiceConfig } from "@/lib/hooks/use-service-config";
import type { Service, ServicePrice } from "@/lib/types";
import { toast } from "sonner";

const serviceSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อบริการ"),
  description: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSuccess?: () => void;
}

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceDialogProps) {
  const { createService, updateService } = useServices({ autoFetch: false });
  const { petTypes, getSizesForPetType } = useServiceConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = service !== null && service !== undefined;

  const activePetTypes = [...petTypes]
    .filter((pt) => pt.active)
    .sort((a, b) => a.order - b.order);

  // State for service type
  const [isSpecial, setIsSpecial] = useState(false);
  const [specialPrice, setSpecialPrice] = useState<string>("");

  // State for selected pet type (เลือกประเภทสัตว์เดียว)
  const [selectedPetTypeId, setSelectedPetTypeId] = useState<string>("");

  // State for prices - key format: "petTypeId_sizeId"
  const [prices, setPrices] = useState<Record<string, number>>({});

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (service) {
        form.reset({
          name: service.name,
          description: service.description || "",
        });

        // ตั้งค่าประเภทบริการ
        setIsSpecial(service.isSpecial);
        if (service.isSpecial) {
          setSpecialPrice(service.specialPrice?.toString() || "");
        } else {
          // Build prices map from existing service
          const priceMap: Record<string, number> = {};
          service.prices?.forEach((p) => {
            if (p.petTypeId && p.sizeId) {
              priceMap[`${p.petTypeId}_${p.sizeId}`] = p.price;
            }
          });
          setPrices(priceMap);
          // ตั้งค่าประเภทสัตว์แรกที่มีราคา
          if (
            service.prices &&
            service.prices.length > 0 &&
            service.prices[0].petTypeId
          ) {
            setSelectedPetTypeId(service.prices[0].petTypeId);
          }
        }
      } else {
        form.reset({
          name: "",
          description: "",
        });
        setIsSpecial(false);
        setSpecialPrice("");
        // ตั้งค่าประเภทสัตว์แรกที่ active
        if (activePetTypes.length > 0) {
          setSelectedPetTypeId(activePetTypes[0].id);
        }
        // Initialize prices to 0
        setPrices({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service]);

  const handlePriceChange = (
    petTypeId: string,
    sizeId: string,
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    setPrices((prev) => ({
      ...prev,
      [`${petTypeId}_${sizeId}`]: numValue,
    }));
  };

  const onSubmit = async (data: ServiceFormData) => {
    // Validation
    if (isSpecial) {
      if (!specialPrice || parseFloat(specialPrice) <= 0) {
        toast.error("กรุณากรอกราคาสำหรับบริการพิเศษ");
        return;
      }
    } else {
      if (!selectedPetTypeId) {
        toast.error("กรุณาเลือกประเภทสัตว์");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (isSpecial) {
        // บริการพิเศษ - ไม่มี prices
        if (isEditing && service) {
          await updateService(service.id, {
            name: data.name,
            description: data.description,
            isSpecial: true,
            specialPrice: parseFloat(specialPrice),
            prices: [],
          });
          toast.success("แก้ไขบริการเรียบร้อยแล้ว");
        } else {
          await createService({
            name: data.name,
            description: data.description,
            isSpecial: true,
            specialPrice: parseFloat(specialPrice),
            active: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            prices: [],
          });
          toast.success("เพิ่มบริการใหม่เรียบร้อยแล้ว");
        }
      } else {
        // บริการปกติ - มี prices ตามประเภทสัตว์และขนาด
        const servicePrices: {
          petTypeId: string;
          sizeId: string;
          price: number;
        }[] = [];

        // บันทึกราคาเฉพาะประเภทสัตว์ที่เลือก
        const sizes = getSizesForPetType(selectedPetTypeId).filter(
          (s) => s.active,
        );
        sizes.forEach((size) => {
          const key = `${selectedPetTypeId}_${size.id}`;
          servicePrices.push({
            petTypeId: selectedPetTypeId,
            sizeId: size.id,
            price: prices[key] || 0,
          });
        });

        if (isEditing && service) {
          await updateService(service.id, {
            name: data.name,
            description: data.description,
            isSpecial: false,
            prices: servicePrices as any,
          });
          toast.success("แก้ไขบริการเรียบร้อยแล้ว");
        } else {
          await createService({
            name: data.name,
            description: data.description,
            isSpecial: false,
            active: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            prices: servicePrices.map((p) => ({
              ...p,
              id: 0,
              serviceId: 0,
            })),
          });
          toast.success("เพิ่มบริการใหม่เรียบร้อยแล้ว");
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPetTypeIcon = (petTypeId: string) => {
    if (petTypeId === "DOG") return <Dog className="h-4 w-4" />;
    if (petTypeId === "CAT") return <Cat className="h-4 w-4" />;
    return null;
  };

  const getPetTypeColor = (petTypeId: string) => {
    if (petTypeId === "DOG") return "text-dog";
    if (petTypeId === "CAT") return "text-cat";
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "แก้ไขข้อมูลบริการและราคา"
              : "เพิ่มบริการใหม่พร้อมกำหนดราคาตามประเภทสัตว์และขนาด"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ประเภทบริการ */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">บริการพิเศษ</Label>
                <p className="text-sm text-muted-foreground">
                  บริการที่ไม่เกี่ยวข้องกับประเภทสัตว์และขนาด (ราคาคงที่)
                </p>
              </div>
              <Switch
                checked={isSpecial}
                onCheckedChange={setIsSpecial}
                disabled={isEditing}
              />
            </div>

            {!isSpecial && (
              <div className="space-y-4">
                <div>
                  <Label>เลือกประเภทสัตว์</Label>
                  <div className="flex gap-2 mt-2">
                    {activePetTypes.map((petType) => (
                      <Button
                        key={petType.id}
                        type="button"
                        variant={
                          selectedPetTypeId === petType.id
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedPetTypeId(petType.id)}
                        className="flex items-center gap-2"
                      >
                        {getPetTypeIcon(petType.id)}
                        {petType.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {activePetTypes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    กรุณาเปิดใช้งานประเภทสัตว์ในการตั้งค่าก่อน
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อบริการ</FormLabel>
                  <FormControl>
                    <Input placeholder="เช่น อาบน้ำ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รายละเอียด (ไม่บังคับ)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="เช่น อาบน้ำ เป่าขน หวีขน"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Special Service Price */}
            {isSpecial && (
              <FormItem>
                <FormLabel>ราคา</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    value={specialPrice}
                    onChange={(e) => setSpecialPrice(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}

            {/* Regular Service Prices */}
            {!isSpecial &&
              selectedPetTypeId &&
              (() => {
                const sizes = getSizesForPetType(selectedPetTypeId).filter(
                  (s) => s.active,
                );

                if (sizes.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      ไม่มีขนาดสำหรับประเภทสัตว์นี้
                    </div>
                  );
                }

                return (
                  <div className="rounded-lg border p-4 space-y-3">
                    <Label>กำหนดราคาตามขนาด (บาท)</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {sizes.map((size) => (
                        <div key={size.id} className="space-y-1">
                          <Label className="text-xs flex flex-col">
                            <span>{size.name}</span>
                            {size.description && (
                              <span className="text-muted-foreground font-normal">
                                {size.description}
                              </span>
                            )}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={
                              prices[`${selectedPetTypeId}_${size.id}`] || ""
                            }
                            onChange={(e) =>
                              handlePriceChange(
                                selectedPetTypeId,
                                size.id,
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "กำลังบันทึก..."
                  : isEditing
                    ? "บันทึก"
                    : "เพิ่มบริการ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
