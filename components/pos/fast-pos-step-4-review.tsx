"use client";

import { useState } from "react";
import { User, Dog, Cat, ShoppingCart, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatPhoneDisplay } from "@/lib/utils";
import { useFastPOS, getSelectedPets } from "./fast-pos-context";
import { usePOSStore } from "@/lib/store";

interface FastPOSStep4Props {
  onClose: () => void;
}

export function FastPOSStep4Review({ onClose }: FastPOSStep4Props) {
  const { state, goToStep, setLoading, setError, prevStep } = useFastPOS();
  const addToCart = usePOSStore((s) => s.addToCart);
  const setSelectedCustomer = usePOSStore((s) => s.setSelectedCustomer);

  const [isSaving, setIsSaving] = useState(false);

  const { customer, selectedServices } = state;
  const selectedPets = getSelectedPets(state.pets);

  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const handleConfirm = async () => {
    if (!customer) return;
    setIsSaving(true);
    setLoading(true);
    setError(null);

    try {
      // 1. Create or use existing customer
      let customerId = customer.id;

      if (!customer.isExisting) {
        const customerRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customer.name,
            phone: customer.phone,
          }),
        });

        if (!customerRes.ok) {
          const err = await customerRes.json();
          throw new Error(err.error ?? "ไม่สามารถสร้างลูกค้าได้");
        }

        const customerData = await customerRes.json();
        customerId = customerData.data?.id ?? customerData.id;
      }

      if (!customerId) throw new Error("ไม่พบ ID ลูกค้า");

      // 2. Create new pets (only non-existing ones)
      const petIdMap: Record<number, number> = {}; // index → real pet ID

      for (let i = 0; i < state.pets.length; i++) {
        const pet = state.pets[i];
        if (!pet.selected) continue;

        if (pet.isExisting && pet.id) {
          petIdMap[i] = pet.id;
          continue;
        }

        const petRes = await fetch("/api/pets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customerId,
            name: pet.name,
            type: pet.type,
            breed: pet.breed,
            breed_2: null,
            is_mixed_breed: false,
            weight: pet.weight ?? null,
            note: "",
          }),
        });

        if (!petRes.ok) {
          const err = await petRes.json();
          throw new Error(err.error ?? `ไม่สามารถสร้างสัตว์เลี้ยง ${pet.name} ได้`);
        }

        const petData = await petRes.json();
        petIdMap[i] = petData.data?.id ?? petData.id;
      }

      // 3. Set customer in POS store
      setSelectedCustomer(customerId);

      // 4. Add services to cart
      for (const svc of selectedServices) {
        const realPetId = petIdMap[svc.petIndex] ?? svc.petId ?? null;
        addToCart({
          serviceId: svc.serviceId,
          serviceName: svc.serviceName,
          originalPrice: svc.price,
          finalPrice: svc.price,
          isPriceModified: false,
          petId: realPetId,
          petName: svc.petName,
          petType: svc.petType,
        });
      }

      toast.success(`เพิ่ม ${customer.name} ลงรถเข็นแล้ว`);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "เกิดข้อผิดพลาด");
      toast.error(err.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="space-y-4">
      {/* Customer section */}
      <div className="rounded-lg border p-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            ลูกค้า
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => goToStep(1)}
          >
            <Pencil className="h-3 w-3 mr-1" />
            แก้ไข
          </Button>
        </div>
        <p className="font-medium">{customer.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatPhoneDisplay(customer.phone)}
        </p>
      </div>

      {/* Pets section */}
      <div className="rounded-lg border p-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            {selectedPets[0]?.type === "DOG" ? (
              <Dog className="h-4 w-4 text-dog" />
            ) : (
              <Cat className="h-4 w-4 text-cat" />
            )}
            สัตว์เลี้ยง
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => goToStep(2)}
          >
            <Pencil className="h-3 w-3 mr-1" />
            แก้ไข
          </Button>
        </div>
        {selectedPets.map((pet, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {pet.type === "DOG" ? (
              <Dog className="h-3.5 w-3.5 text-dog shrink-0" />
            ) : (
              <Cat className="h-3.5 w-3.5 text-cat shrink-0" />
            )}
            <span>
              {pet.name} · {pet.breed}
              {pet.weight ? ` · ${pet.weight} kg` : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Services section */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            บริการที่เลือก
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => goToStep(3)}
          >
            <Pencil className="h-3 w-3 mr-1" />
            แก้ไข
          </Button>
        </div>

        {selectedPets.map((pet, petIdx) => {
          const petGlobalIdx = state.pets.indexOf(pet);
          const petServices = selectedServices.filter(
            (s) => s.petIndex === petGlobalIdx,
          );
          if (petServices.length === 0) return null;

          return (
            <div key={petIdx} className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                {pet.type === "DOG" ? "🐕" : "🐈"} {pet.name}
              </p>
              {petServices.map((svc) => (
                <div
                  key={svc.serviceId}
                  className="flex justify-between items-center text-sm pl-3"
                >
                  <span>{svc.serviceName}</span>
                  <span className="font-medium">฿{svc.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          );
        })}

        <Separator />

        <div className="flex justify-between items-center font-semibold">
          <span>รวมทั้งหมด</span>
          <span className="text-primary text-lg">฿{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Error message */}
      {state.error && (
        <p className="text-sm text-destructive text-center">{state.error}</p>
      )}

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={prevStep} disabled={isSaving}>
          ← ย้อนกลับ
        </Button>
        <Button onClick={handleConfirm} disabled={isSaving} className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          {isSaving ? "กำลังบันทึก..." : "เพิ่มลงรถเข็น"}
        </Button>
      </div>
    </div>
  );
}
