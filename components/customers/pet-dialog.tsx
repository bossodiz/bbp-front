"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronsUpDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCustomerStore } from "@/lib/store";
import type { Pet } from "@/lib/types";
import { petTypeLabels } from "@/lib/types";
import { commonDogBreeds, commonCatBreeds } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const petSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อสัตว์เลี้ยง"),
  type: z.enum(["DOG", "CAT"], {
    required_error: "กรุณาเลือกประเภทสัตว์",
  }),
  breed: z.string().min(1, "กรุณากรอกสายพันธุ์"),
  weight: z.coerce
    .number({ invalid_type_error: "กรุณากรอกน้ำหนัก" })
    .positive("น้ำหนักต้องมากกว่า 0")
    .max(200, "น้ำหนักไม่ถูกต้อง"),
  note: z.string().optional(),
});

type PetFormData = z.infer<typeof petSchema>;

interface PetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  pet?: Pet | null;
}

export function PetDialog({
  open,
  onOpenChange,
  customerId,
  pet,
}: PetDialogProps) {
  const { addPet, updatePet } = useCustomerStore();
  const isEditing = pet !== null && pet !== undefined;
  const [breedOpen, setBreedOpen] = useState(false);

  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: "",
      type: undefined,
      breed: "",
      weight: undefined,
      note: "",
    },
  });

  const selectedType = form.watch("type");

  // Get breed list based on selected pet type
  const breedList = useMemo(() => {
    if (selectedType === "DOG") return commonDogBreeds;
    if (selectedType === "CAT") return commonCatBreeds;
    return [];
  }, [selectedType]);

  useEffect(() => {
    if (open) {
      if (pet) {
        form.reset({
          name: pet.name,
          type: pet.type,
          breed: pet.breed,
          weight: pet.weight,
          note: pet.note || "",
        });
      } else {
        form.reset({
          name: "",
          type: undefined,
          breed: "",
          weight: undefined,
          note: "",
        });
      }
    }
  }, [open, pet, form]);

  // Reset breed when type changes
  useEffect(() => {
    if (!isEditing && selectedType) {
      form.setValue("breed", "");
    }
  }, [selectedType, isEditing, form]);

  const onSubmit = (data: PetFormData) => {
    if (isEditing && pet) {
      updatePet(customerId, pet.id, {
        name: data.name,
        type: data.type,
        breed: data.breed,
        weight: data.weight,
        note: data.note,
      });
      toast.success("แก้ไขข้อมูลสัตว์เลี้ยงเรียบร้อยแล้ว");
    } else {
      addPet(customerId, {
        name: data.name,
        type: data.type,
        breed: data.breed,
        weight: data.weight,
        note: data.note,
      });
      toast.success("เพิ่มสัตว์เลี้ยงเรียบร้อยแล้ว");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "แก้ไขข้อมูลสัตว์เลี้ยง" : "เพิ่มสัตว์เลี้ยง"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "แก้ไขข้อมูลสัตว์เลี้ยงในระบบ"
              : "เพิ่มข้อมูลสัตว์เลี้ยงใหม่"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อสัตว์เลี้ยง</FormLabel>
                  <FormControl>
                    <Input placeholder="เช่น มิกกี้" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภท</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกประเภท" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          Object.keys(petTypeLabels) as Array<
                            keyof typeof petTypeLabels
                          >
                        ).map((key) => (
                          <SelectItem key={key} value={key}>
                            {petTypeLabels[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>น้ำหนัก (กก.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="เช่น 5.5"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>สายพันธุ์</FormLabel>
                  <Popover open={breedOpen} onOpenChange={setBreedOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={breedOpen}
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={!selectedType}
                        >
                          {field.value || (selectedType ? "เลือกหรือพิมพ์สายพันธุ์" : "เลือกประเภทก่อน")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="พิมพ์ค้นหาหรือเพิ่มสายพันธุ์..."
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <button
                              type="button"
                              className="w-full px-2 py-1.5 text-sm text-left hover:bg-muted rounded"
                              onClick={() => {
                                setBreedOpen(false);
                              }}
                            >
                              ใช้ &quot;{field.value}&quot;
                            </button>
                          </CommandEmpty>
                          <CommandGroup>
                            {breedList.map((breed) => (
                              <CommandItem
                                key={breed}
                                value={breed}
                                onSelect={(currentValue) => {
                                  field.onChange(currentValue);
                                  setBreedOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === breed
                                      ? "opacity-100"
                                      : "opacity-0"
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ (ไม่บังคับ)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="เช่น แพ้แชมพูบางชนิด, ขี้กลัว"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit">
                {isEditing ? "บันทึก" : "เพิ่มสัตว์เลี้ยง"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
