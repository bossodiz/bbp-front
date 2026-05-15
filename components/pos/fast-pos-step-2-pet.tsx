"use client";

import { useState, useEffect } from "react";
import { Dog, Cat, Plus, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFastPOS, FastPOSPet, getSelectedPets } from "./fast-pos-context";

interface PetTypeOption {
  id: string;
  name: string;
  icon: string;
}

interface BreedOption {
  id: number;
  name: string;
}

interface PetFormState {
  name: string;
  type: "DOG" | "CAT" | "";
  breedId: number | "";
  weight: string;
}

const emptyForm: PetFormState = { name: "", type: "", breedId: "", weight: "" };

export function FastPOSStep2Pet() {
  const { state, setPets, addPet, updatePetWeight, togglePetSelected, nextStep, prevStep } =
    useFastPOS();

  const isExistingCustomer = state.customer?.isExisting ?? false;

  // Pet types & breeds fetched from API
  const [petTypes, setPetTypes] = useState<PetTypeOption[]>([]);
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingBreeds, setLoadingBreeds] = useState(false);

  // New pet form
  const [form, setForm] = useState<PetFormState>(emptyForm);
  const [showForm, setShowForm] = useState(!isExistingCustomer);

  // Weight edit dialog (per existing pet)
  const [weightEditIndex, setWeightEditIndex] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState("");

  // Fetch pet types on mount
  useEffect(() => {
    const fetch_ = async () => {
      setLoadingTypes(true);
      try {
        const res = await fetch("/api/config/pet-types");
        if (res.ok) {
          const json = await res.json();
          const types = (json.data ?? []).map((t: any) => ({
            id: t.id,
            name: t.name,
            icon: t.icon ?? (t.id === "DOG" ? "🐕" : "🐈"),
          }));
          setPetTypes(types);
        }
      } finally {
        setLoadingTypes(false);
      }
    };
    fetch_();
  }, []);

  // Fetch breeds when type changes
  useEffect(() => {
    if (!form.type) {
      setBreeds([]);
      return;
    }
    const fetch_ = async () => {
      setLoadingBreeds(true);
      try {
        const res = await fetch(`/api/breeds?petTypeId=${form.type}&active=true`);
        if (res.ok) {
          const json = await res.json();
          const list = (json.data ?? json ?? []).map((b: any) => ({
            id: b.id,
            name: b.name,
          }));
          setBreeds(list);
        }
      } finally {
        setLoadingBreeds(false);
      }
    };
    fetch_();
    setForm((f) => ({ ...f, breedId: "" }));
  }, [form.type]);

  const selectedBreedName = breeds.find((b) => b.id === form.breedId)?.name ?? "";

  const handleAddPet = () => {
    if (!form.name || !form.type || form.breedId === "") return;
    addPet({
      name: form.name.trim(),
      type: form.type as "DOG" | "CAT",
      breed: selectedBreedName,
      breedId: form.breedId as number,
      weight: form.weight ? parseFloat(form.weight) : undefined,
    });
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleRemovePet = (index: number) => {
    const updated = state.pets.filter((_, i) => i !== index);
    setPets(updated);
  };

  const handleSaveWeight = () => {
    if (weightEditIndex === null) return;
    const w = parseFloat(weightInput);
    if (!isNaN(w) && w > 0) {
      updatePetWeight(weightEditIndex, w);
    }
    setWeightEditIndex(null);
    setWeightInput("");
  };

  const selectedCount = getSelectedPets(state.pets).length;
  const canNext = selectedCount > 0;

  const petIcon = (type: "DOG" | "CAT") =>
    type === "DOG" ? (
      <Dog className="h-5 w-5 text-dog" />
    ) : (
      <Cat className="h-5 w-5 text-cat" />
    );

  return (
    <div className="space-y-4">
      {/* Existing customer: checkbox multi-select */}
      {isExistingCustomer && state.pets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">เลือกสัตว์เลี้ยง</Label>
          <div className="space-y-2">
            {state.pets.map((pet, index) => (
              <div
                key={pet.id ?? index}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  pet.selected
                    ? pet.type === "DOG"
                      ? "border-dog/40 bg-dog/5"
                      : "border-cat/40 bg-cat/5"
                    : "border-border hover:bg-accent/30",
                )}
              >
                <button
                  type="button"
                  onClick={() => togglePetSelected(index)}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                    pet.selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground",
                  )}
                >
                  {pet.selected && <Check className="h-3 w-3" />}
                </button>

                <button
                  type="button"
                  onClick={() => togglePetSelected(index)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  {petIcon(pet.type)}
                  <div>
                    <p className="font-medium text-sm">{pet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pet.breed}
                      {pet.weight ? ` · ${pet.weight} kg` : " · ไม่ระบุน้ำหนัก"}
                    </p>
                  </div>
                </button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => {
                    setWeightEditIndex(index);
                    setWeightInput(pet.weight?.toString() ?? "");
                  }}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  น้ำหนัก
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New pets added in this session */}
      {state.pets.filter((p) => !p.isExisting).length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">สัตว์เลี้ยงใหม่</Label>
          {state.pets
            .filter((p) => !p.isExisting)
            .map((pet) => {
              const index = state.pets.indexOf(pet);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
                >
                  {petIcon(pet.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pet.breed}
                      {pet.weight ? ` · ${pet.weight} kg` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemovePet(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
        </div>
      )}

      {/* Add new pet form */}
      {showForm ? (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">เพิ่มสัตว์เลี้ยงใหม่</p>

          <div className="space-y-1.5">
            <Label className="text-xs">
              ชื่อ <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="ชื่อสัตว์เลี้ยง"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              ประเภท <span className="text-destructive">*</span>
            </Label>
            {loadingTypes ? (
              <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
            ) : (
              <div className="flex gap-2">
                {petTypes.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, type: pt.id as "DOG" | "CAT" }))
                    }
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      form.type === pt.id
                        ? pt.id === "DOG"
                          ? "border-dog bg-dog/10 text-dog font-medium"
                          : "border-cat bg-cat/10 text-cat font-medium"
                        : "border-border hover:bg-accent/30",
                    )}
                  >
                    <span>{pt.icon}</span>
                    {pt.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              พันธุ์ <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.breedId === "" ? "" : String(form.breedId)}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, breedId: parseInt(v) }))
              }
              disabled={!form.type || loadingBreeds}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !form.type
                      ? "เลือกประเภทสัตว์ก่อน"
                      : loadingBreeds
                        ? "กำลังโหลด..."
                        : "เลือกพันธุ์"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {breeds.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">น้ำหนัก (kg) — ไม่บังคับ</Label>
            <Input
              type="number"
              placeholder="เช่น 5.5"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              min={0}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              ใช้สำหรับประมาณขนาดบริการ (S/M/L)
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleAddPet}
              disabled={!form.name || !form.type || form.breedId === ""}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              เพิ่มสัตว์เลี้ยง
            </Button>
            {(isExistingCustomer || state.pets.length > 0) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                ยกเลิก
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          เพิ่มสัตว์เลี้ยงใหม่
        </Button>
      )}

      {/* Validation hint */}
      {!canNext && !showForm && (
        <p className="text-xs text-muted-foreground text-center">
          เลือกอย่างน้อย 1 สัตว์เลี้ยงก่อนดำเนินการต่อ
        </p>
      )}

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={prevStep}>
          ← ย้อนกลับ
        </Button>
        <Button onClick={nextStep} disabled={!canNext}>
          ถัดไป →
        </Button>
      </div>

      {/* Weight edit dialog */}
      <Dialog
        open={weightEditIndex !== null}
        onOpenChange={(open) => !open && setWeightEditIndex(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>แก้ไขน้ำหนัก</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {weightEditIndex !== null && (
              <p className="text-sm text-muted-foreground">
                {state.pets[weightEditIndex]?.name}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="น้ำหนัก"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                min={0}
                step={0.1}
                autoFocus
              />
              <span className="text-sm font-medium">kg</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWeightEditIndex(null)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveWeight}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
