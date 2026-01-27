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
import { useServiceStore, useServiceConfigStore } from "@/lib/store";
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
}

export function ServiceDialog({
  open,
  onOpenChange,
  service,
}: ServiceDialogProps) {
  const { addService, updateService } = useServiceStore();
  const { petTypes, sizes } = useServiceConfigStore();
  const isEditing = service !== null && service !== undefined;

  const sortedPetTypes = [...petTypes].sort((a, b) => a.order - b.order);
  const sortedSizes = [...sizes].sort((a, b) => a.order - b.order);

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
        // Build prices map from existing service
        const priceMap: Record<string, number> = {};
        service.prices.forEach((p) => {
          priceMap[`${p.petTypeId}_${p.sizeId}`] = p.price;
        });
        setPrices(priceMap);
      } else {
        form.reset({
          name: "",
          description: "",
        });
        // Initialize all prices to 0
        const initialPrices: Record<string, number> = {};
        petTypes.forEach((pt) => {
          sizes.forEach((s) => {
            initialPrices[`${pt.id}_${s.id}`] = 0;
          });
        });
        setPrices(initialPrices);
      }
    }
  }, [open, service, form, petTypes, sizes]);

  const handlePriceChange = (petTypeId: string, sizeId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPrices((prev) => ({
      ...prev,
      [`${petTypeId}_${sizeId}`]: numValue,
    }));
  };

  const onSubmit = (data: ServiceFormData) => {
    const servicePrices: Omit<ServicePrice, "id" | "serviceId">[] = [];
    let priceId = 1;

    petTypes.forEach((petType) => {
      sizes.forEach((size) => {
        const key = `${petType.id}_${size.id}`;
        servicePrices.push({
          petTypeId: petType.id,
          sizeId: size.id,
          price: prices[key] || 0,
        });
        priceId++;
      });
    });

    if (isEditing && service) {
      updateService(service.id, {
        name: data.name,
        description: data.description,
        prices: servicePrices.map((p, i) => ({
          ...p,
          id: service.prices[i]?.id || i + 1,
          serviceId: service.id,
        })),
      });
      toast.success("แก้ไขบริการเรียบร้อยแล้ว");
    } else {
      addService({
        name: data.name,
        description: data.description,
        prices: servicePrices.map((p, i) => ({
          ...p,
          id: i + 1,
          serviceId: 0,
        })),
      });
      toast.success("เพิ่มบริการใหม่เรียบร้อยแล้ว");
    }
    onOpenChange(false);
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

            <div className="space-y-4">
              <Label>ราคาตามประเภทสัตว์และขนาด (บาท)</Label>

              {sortedPetTypes.map((petType) => (
                <div key={petType.id} className="rounded-lg border p-4 space-y-3">
                  <div className={`flex items-center gap-2 ${getPetTypeColor(petType.id)}`}>
                    {getPetTypeIcon(petType.id)}
                    <span className="font-medium">{petType.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {sortedSizes.map((size) => (
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
                          value={prices[`${petType.id}_${size.id}`] || ""}
                          onChange={(e) =>
                            handlePriceChange(petType.id, size.id, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit">{isEditing ? "บันทึก" : "เพิ่มบริการ"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
