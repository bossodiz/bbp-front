"use client";

import { useState } from "react";
import { Plus, X, Check, ChevronsUpDown } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBreeds } from "@/lib/hooks/use-breeds";
import type { Pet, NewPetData } from "@/lib/types";
import { petTypeLabels } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PetSelectorProps {
  availablePets: Pet[]; // สัตว์เลี้ยงที่มีอยู่ของลูกค้า
  selectedPetIds: number[];
  newPets: NewPetData[];
  onSelectPet: (petId: number) => void;
  onRemovePet: (petId: number) => void;
  onAddNewPet: (pet: NewPetData) => void;
  onRemoveNewPet: (index: number) => void;
  disabled?: boolean;
}

export function PetSelector({
  availablePets,
  selectedPetIds,
  newPets,
  onSelectPet,
  onRemovePet,
  onAddNewPet,
  onRemoveNewPet,
  disabled = false,
}: PetSelectorProps) {
  const [addPetDialogOpen, setAddPetDialogOpen] = useState(false);
  const [breedOpen, setBreedOpen] = useState(false);
  const [newPetForm, setNewPetForm] = useState<NewPetData>({
    name: "",
    type: "DOG",
    breed: "",
    isMixedBreed: false,
    weight: null,
    note: "",
  });

  const { breeds } = useBreeds({
    petTypeId: newPetForm.type,
    active: true,
    autoFetch: !!newPetForm.type,
  });

  const breedList = breeds.map((breed) => breed.name);

  const selectedPets = availablePets.filter((pet) =>
    selectedPetIds.includes(pet.id),
  );
  const unselectedPets = availablePets.filter(
    (pet) => !selectedPetIds.includes(pet.id),
  );

  const handleAddNewPet = () => {
    if (!newPetForm.name) {
      return;
    }
    onAddNewPet(newPetForm);
    setNewPetForm({
      name: "",
      type: "DOG",
      breed: "",
      isMixedBreed: false,
      weight: null,
      note: "",
    });
    setAddPetDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>สัตว์เลี้ยงที่ใช้บริการ</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddPetDialogOpen(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          เพิ่มสัตว์เลี้ยงใหม่
        </Button>
      </div>

      {/* เลือกจากสัตว์เลี้ยงที่มีอยู่ */}
      {unselectedPets.length > 0 && (
        <Select
          key={selectedPetIds.join("-")}
          value=""
          onValueChange={(value) => onSelectPet(parseInt(value))}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกสัตว์เลี้ยง" />
          </SelectTrigger>
          <SelectContent>
            {unselectedPets.map((pet) => (
              <SelectItem key={pet.id} value={pet.id.toString()}>
                {pet.name} ({petTypeLabels[pet.type]}) -{" "}
                {pet.weight ? `${pet.weight} kg` : "ไม่ระบุน้ำหนัก"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* แสดงสัตว์เลี้ยงที่เลือกแล้ว */}
      <div className="flex flex-wrap gap-2">
        {selectedPets.map((pet) => (
          <Badge key={pet.id} variant="secondary" className="text-sm">
            {pet.name} ({petTypeLabels[pet.type]})
            <button
              type="button"
              onClick={() => onRemovePet(pet.id)}
              className="ml-2 hover:text-destructive"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {newPets.map((pet, index) => (
          <Badge key={`new-${index}`} variant="default" className="text-sm">
            {pet.name} ({petTypeLabels[pet.type]}) - ใหม่
            <button
              type="button"
              onClick={() => onRemoveNewPet(index)}
              className="ml-2 hover:text-destructive"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {selectedPets.length === 0 && newPets.length === 0 && (
        <p className="text-sm text-muted-foreground">
          ยังไม่ได้เลือกสัตว์เลี้ยง
        </p>
      )}

      {/* Add New Pet Dialog */}
      <Dialog open={addPetDialogOpen} onOpenChange={setAddPetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มสัตว์เลี้ยงใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลสัตว์เลี้ยงที่จะเพิ่มเข้าระบบ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อสัตว์เลี้ยง *</Label>
              <Input
                value={newPetForm.name}
                onChange={(e) =>
                  setNewPetForm({ ...newPetForm, name: e.target.value })
                }
                placeholder="เช่น มะลิ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ประเภทสัตว์ *</Label>
                <Select
                  value={newPetForm.type}
                  onValueChange={(value: "DOG" | "CAT") =>
                    setNewPetForm({ ...newPetForm, type: value, breed: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOG">{petTypeLabels.DOG}</SelectItem>
                    <SelectItem value="CAT">{petTypeLabels.CAT}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>สายพันธุ์</Label>
                <Popover
                  open={breedOpen}
                  onOpenChange={setBreedOpen}
                  modal={true}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={breedOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        !newPetForm.breed && "text-muted-foreground",
                      )}
                    >
                      {newPetForm.breed || "เลือกหรือพิมพ์สายพันธุ์"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ค้นหาสายพันธุ์..." />
                      <CommandList className="max-h-[200px]">
                        <CommandEmpty>
                          {newPetForm.breed ? (
                            <div className="py-2 text-center text-sm">
                              กด Enter เพื่อใช้ "{newPetForm.breed}"
                            </div>
                          ) : (
                            "ไม่พบสายพันธุ์"
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {breedList.map((breed) => (
                            <CommandItem
                              key={breed}
                              value={breed}
                              onSelect={(currentValue) => {
                                setNewPetForm({
                                  ...newPetForm,
                                  breed: currentValue,
                                });
                                setBreedOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newPetForm.breed === breed
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {breed}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>น้ำหนัก (กก.) - ไม่บังคับ</Label>
              <Input
                type="number"
                min="0"
                max="50"
                step="0.01"
                value={newPetForm.weight ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewPetForm({
                    ...newPetForm,
                    weight: value === "" ? null : parseFloat(value),
                  });
                }}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.currentTarget.select()}
                placeholder="0.00 - 50.00 (ไม่บังคับ)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddPetDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleAddNewPet}
              disabled={
                !newPetForm.name ||
                newPetForm.weight === undefined ||
                newPetForm.weight === null
              }
            >
              เพิ่มสัตว์เลี้ยง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
