"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronsUpDown, Dog, Cat, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useCustomers } from "@/lib/hooks/use-customers";
import { useBreeds } from "@/lib/hooks/use-breeds";
import type { Pet } from "@/lib/types";
import { petTypeLabels } from "@/lib/types";
import { toast } from "sonner";

const petSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อสัตว์เลี้ยง"),
    type: z.enum(["DOG", "CAT"], {
      required_error: "กรุณาเลือกประเภทสัตว์",
    }),
    isMixedBreed: z.boolean().default(false),
    breed: z.string().min(1, "กรุณากรอกสายพันธุ์"),
    breed2: z.string().optional(),
    weight: z.coerce
      .number({ invalid_type_error: "น้ำหนักต้องเป็นตัวเลข" })
      .min(0, "น้ำหนักต้องมากกว่าหรือเท่ากับ 0")
      .max(50, "น้ำหนักต้องไม่เกิน 50 กิโลกรัม")
      .refine((val) => Number.isInteger(val * 100), {
        message: "น้ำหนักต้องมีทศนิยมไม่เกิน 2 ตำแหน่ง",
      })
      .nullable()
      .optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
      // If mixed breed is checked, breed2 must be filled
      if (data.isMixedBreed && !data.breed2) {
        return false;
      }
      return true;
    },
    {
      message: "กรุณาเลือกสายพันธุ์ที่ 2",
      path: ["breed2"],
    },
  );

type PetFormData = z.infer<typeof petSchema>;

interface PetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  pet?: Pet | null;
  onSuccess?: () => void;
}

export function PetDialog({
  open,
  onOpenChange,
  customerId,
  pet,
  onSuccess,
}: PetDialogProps) {
  const { createPet, updatePet } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = pet !== null && pet !== undefined;
  const [breedOpen, setBreedOpen] = useState(false);
  const [breed2Open, setBreed2Open] = useState(false);
  const [breedSearchValue, setBreedSearchValue] = useState("");
  const [breed2SearchValue, setBreed2SearchValue] = useState("");
  const initialTypeData = useRef<string | undefined>(undefined);
  const initialBreedData = useRef<{ breed: string; breed2: string } | null>(
    null,
  );

  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: "",
      type: undefined,
      isMixedBreed: false,
      breed: "",
      breed2: "",
      weight: null,
      note: "",
    },
  });

  const selectedType = form.watch("type");
  const isMixedBreed = form.watch("isMixedBreed");

  // Fetch breeds from API based on selected pet type (exclude mixed breeds for selection)
  const {
    breeds,
    loading: breedsLoading,
    createBreed,
  } = useBreeds({
    petTypeId: selectedType,
    active: true,
    includeMixed: false, // Only show pure breeds for selection
    autoFetch: !!selectedType,
  });

  // Get breed list based on selected pet type
  const breedList = useMemo(() => {
    return breeds.map((breed) => breed.name);
  }, [breeds]);

  useEffect(() => {
    if (open) {
      if (pet) {
        // เก็บข้อมูลเริ่มต้น
        initialTypeData.current = pet.type;
        initialBreedData.current = {
          breed: pet.breed,
          breed2: pet.breed2 || "",
        };
        form.reset({
          name: pet.name,
          type: pet.type,
          isMixedBreed: pet.isMixedBreed || false,
          breed: pet.breed,
          breed2: pet.breed2 || "",
          weight: pet.weight,
          note: pet.note || "",
        });
      } else {
        initialTypeData.current = undefined;
        initialBreedData.current = null;
        form.reset({
          name: "",
          type: undefined,
          isMixedBreed: false,
          breed: "",
          breed2: "",
          weight: null,
          note: "",
        });
      }
    }
  }, [open, pet, form]);

  // Handle type changes - restore original breed if returning to initial type, otherwise clear
  useEffect(() => {
    if (selectedType) {
      // ถ้ายังไม่มี initialTypeData (กรณีเพิ่มใหม่ครั้งแรก หรือ แก้ไขครั้งแรก)
      if (!initialTypeData.current) {
        initialTypeData.current = selectedType;
      }
      // เช็คว่าเป็น type เดิมหรือไม่
      else if (selectedType === initialTypeData.current) {
        // ถ้าเป็น type เดิม ให้รอ breeds โหลดเสร็จแล้ว restore ค่าเดิม (เฉพาะกรณีแก้ไข)
        if (breeds.length > 0 && !breedsLoading && initialBreedData.current) {
          const currentBreed = form.getValues("breed");
          const currentBreed2 = form.getValues("breed2");

          if (!currentBreed && initialBreedData.current.breed) {
            form.setValue("breed", initialBreedData.current.breed);
          }
          if (!currentBreed2 && initialBreedData.current.breed2) {
            form.setValue("breed2", initialBreedData.current.breed2);
          }
        }
      } else {
        // ถ้าเป็น type ใหม่ ให้ clear ค่า breed และอัพเดท initialTypeData
        form.setValue("breed", "");
        form.setValue("breed2", "");
        // อัพเดท initialTypeData เป็น type ใหม่
        initialTypeData.current = selectedType;
        // clear initialBreedData เพราะสายพันธุ์เก่าไม่เกี่ยวข้องแล้ว
        initialBreedData.current = null;
      }
    }
  }, [selectedType, breeds, breedsLoading, form]);

  // Reset breed2 when isMixedBreed changes
  useEffect(() => {
    if (!isMixedBreed) {
      form.setValue("breed2", "");
    }
  }, [isMixedBreed, form]);

  const onSubmit = async (data: PetFormData) => {
    try {
      setIsSubmitting(true);

      // Check if breed exists in the list, if not create it
      const breedExists = breedList.includes(data.breed);
      if (!breedExists && data.type) {
        try {
          const maxOrder =
            breeds.length > 0
              ? Math.max(...breeds.map((b) => b.order_index))
              : 0;
          await createBreed({
            pet_type_id: data.type,
            name: data.breed,
            is_mixed: false,
            order_index: maxOrder + 1,
            active: true,
          });
          toast.success(`เพิ่มสายพันธุ์ "${data.breed}" เรียบร้อยแล้ว`);
        } catch (error: any) {
          console.error("Error creating breed:", error);
          // Continue even if breed creation fails
        }
      }

      // Check breed2 if mixed breed
      if (data.isMixedBreed && data.breed2) {
        const breed2Exists = breedList.includes(data.breed2);
        if (!breed2Exists && data.type) {
          try {
            const maxOrder =
              breeds.length > 0
                ? Math.max(...breeds.map((b) => b.order_index))
                : 0;
            await createBreed({
              pet_type_id: data.type,
              name: data.breed2,
              is_mixed: false,
              order_index: maxOrder + 2,
              active: true,
            });
            toast.success(`เพิ่มสายพันธุ์ "${data.breed2}" เรียบร้อยแล้ว`);
          } catch (error: any) {
            console.error("Error creating breed2:", error);
            // Continue even if breed creation fails
          }
        }
      }

      if (isEditing && pet) {
        await updatePet(pet.id, {
          name: data.name,
          type: data.type,
          breed: data.breed,
          breed2: data.isMixedBreed ? data.breed2 : undefined,
          isMixedBreed: data.isMixedBreed,
          weight: data.weight ?? null,
          note: data.note,
        });
        toast.success("แก้ไขข้อมูลสัตว์เลี้ยงเรียบร้อยแล้ว");
      } else {
        await createPet(customerId, {
          name: data.name,
          type: data.type,
          breed: data.breed,
          breed2: data.isMixedBreed ? data.breed2 : undefined,
          isMixedBreed: data.isMixedBreed,
          weight: data.weight ?? null,
          note: data.note,
        });
        toast.success("เพิ่มสัตว์เลี้ยงเรียบร้อยแล้ว");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
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
                            <div className="flex items-center gap-2">
                              {key === "DOG" ? (
                                <Dog className="h-4 w-4" />
                              ) : (
                                <Cat className="h-4 w-4" />
                              )}
                              {petTypeLabels[key]}
                            </div>
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
                        step="0.01"
                        min="0"
                        max="50"
                        placeholder="0.00 - 50.00"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? null : parseFloat(value),
                          );
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isMixedBreed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      id="isMixedBreed"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                    />
                  </FormControl>
                  <label
                    htmlFor="isMixedBreed"
                    className="text-sm font-normal cursor-pointer select-none"
                  >
                    สายพันธุ์ผสม
                  </label>
                </FormItem>
              )}
            />
            {isMixedBreed ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>สายพันธุ์ที่ 1</FormLabel>
                      <Popover open={breedOpen} onOpenChange={setBreedOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={breedOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                              disabled={!selectedType}
                            >
                              {field.value || "เลือกสายพันธุ์"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[300px] p-0 max-h-[400px] overflow-auto"
                          align="start"
                        >
                          <Command>
                            <CommandInput
                              placeholder="พิมพ์ค้นหาสายพันธุ์..."
                              className="h-9"
                              value={breedSearchValue}
                              onValueChange={setBreedSearchValue}
                            />
                            <CommandList className="max-h-[300px]">
                              <CommandEmpty>ไม่พบสายพันธุ์</CommandEmpty>
                              <CommandGroup>
                                {breedSearchValue &&
                                  !breedList.some((b) =>
                                    b
                                      .toLowerCase()
                                      .includes(breedSearchValue.toLowerCase()),
                                  ) && (
                                    <CommandItem
                                      value={breedSearchValue}
                                      onSelect={() => {
                                        field.onChange(breedSearchValue);
                                        setBreedOpen(false);
                                        setBreedSearchValue("");
                                      }}
                                      className="cursor-pointer text-primary"
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      เพิ่มสายพันธุ์ "{breedSearchValue}"
                                    </CommandItem>
                                  )}
                                {breedList.map((breed) => (
                                  <CommandItem
                                    key={breed}
                                    value={breed}
                                    onSelect={(currentValue) => {
                                      field.onChange(currentValue);
                                      setBreedOpen(false);
                                      setBreedSearchValue("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === breed
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="breed2"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>สายพันธุ์ที่ 2</FormLabel>
                      <Popover open={breed2Open} onOpenChange={setBreed2Open}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={breed2Open}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                              disabled={!selectedType}
                            >
                              {field.value || "เลือกสายพันธุ์"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[300px] p-0 max-h-[400px] overflow-auto"
                          align="start"
                        >
                          <Command>
                            <CommandInput
                              placeholder="พิมพ์ค้นหาสายพันธุ์..."
                              className="h-9"
                              value={breed2SearchValue}
                              onValueChange={setBreed2SearchValue}
                            />
                            <CommandList className="max-h-[300px]">
                              <CommandEmpty>ไม่พบสายพันธุ์</CommandEmpty>
                              <CommandGroup>
                                {breed2SearchValue &&
                                  !breedList.some((b) =>
                                    b
                                      .toLowerCase()
                                      .includes(
                                        breed2SearchValue.toLowerCase(),
                                      ),
                                  ) && (
                                    <CommandItem
                                      value={breed2SearchValue}
                                      onSelect={() => {
                                        field.onChange(breed2SearchValue);
                                        setBreed2Open(false);
                                        setBreed2SearchValue("");
                                      }}
                                      className="cursor-pointer text-primary"
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      เพิ่มสายพันธุ์ "{breed2SearchValue}"
                                    </CommandItem>
                                  )}
                                {breedList.map((breed) => (
                                  <CommandItem
                                    key={breed}
                                    value={breed}
                                    onSelect={(currentValue) => {
                                      field.onChange(currentValue);
                                      setBreed2Open(false);
                                      setBreed2SearchValue("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === breed
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
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
                              !field.value && "text-muted-foreground",
                            )}
                            disabled={!selectedType}
                          >
                            {field.value ||
                              (selectedType
                                ? "เลือกหรือพิมพ์สายพันธุ์"
                                : "เลือกประเภทก่อน")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[300px] p-0 max-h-[400px] overflow-auto"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="พิมพ์ค้นหาสายพันธุ์..."
                            className="h-9"
                            value={breedSearchValue}
                            onValueChange={setBreedSearchValue}
                          />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>ไม่พบสายพันธุ์</CommandEmpty>
                            <CommandGroup>
                              {breedSearchValue &&
                                !breedList.some((b) =>
                                  b
                                    .toLowerCase()
                                    .includes(breedSearchValue.toLowerCase()),
                                ) && (
                                  <CommandItem
                                    value={breedSearchValue}
                                    onSelect={() => {
                                      field.onChange(breedSearchValue);
                                      setBreedOpen(false);
                                      setBreedSearchValue("");
                                    }}
                                    className="cursor-pointer text-primary"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    เพิ่มสายพันธุ์ "{breedSearchValue}"
                                  </CommandItem>
                                )}
                              {breedList.map((breed) => (
                                <CommandItem
                                  key={breed}
                                  value={breed}
                                  onSelect={(currentValue) => {
                                    field.onChange(currentValue);
                                    setBreedOpen(false);
                                    setBreedSearchValue("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === breed
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "กำลังบันทึก..."
                  : isEditing
                    ? "บันทึก"
                    : "เพิ่มสัตว์เลี้ยง"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
