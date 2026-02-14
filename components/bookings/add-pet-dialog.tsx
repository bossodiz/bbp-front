"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronsUpDown, Dog, Cat, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useBreeds } from "@/lib/hooks/use-breeds";
import type { NewPetData } from "@/lib/types";
import { petTypeLabels } from "@/lib/types";
import { cn } from "@/lib/utils";

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
      .nullable()
      .optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
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

interface AddPetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPet: (pet: NewPetData) => void;
}

export function AddPetDialog({
  open,
  onOpenChange,
  onAddPet,
}: AddPetDialogProps) {
  const [breedOpen, setBreedOpen] = useState(false);
  const [breed2Open, setBreed2Open] = useState(false);
  const [breedSearchValue, setBreedSearchValue] = useState("");
  const [breed2SearchValue, setBreed2SearchValue] = useState("");

  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: "",
      type: "DOG",
      isMixedBreed: false,
      breed: "",
      breed2: "",
      weight: 0,
      note: "",
    },
  });

  const selectedType = form.watch("type");
  const isMixedBreed = form.watch("isMixedBreed");

  const { breeds } = useBreeds({
    petTypeId: selectedType,
    active: true,
    autoFetch: !!selectedType,
  });

  const breedList = useMemo(() => {
    return breeds.map((breed) => breed.name);
  }, [breeds]);

  const handleSubmit = (data: PetFormData) => {
    const petData: NewPetData = {
      name: data.name,
      type: data.type,
      breed: data.breed,
      breed2: data.isMixedBreed ? data.breed2 : undefined,
      isMixedBreed: data.isMixedBreed,
      weight: data.weight || null,
      note: data.note,
    };
    onAddPet(petData);
    form.reset({
      name: "",
      type: "DOG",
      isMixedBreed: false,
      breed: "",
      breed2: "",
      weight: null,
      note: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มสัตว์เลี้ยง</DialogTitle>
          <DialogDescription>เพิ่มข้อมูลสัตว์เลี้ยงใหม่</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
                    <FormLabel>น้ำหนัก (กก.) - ไม่บังคับ</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        placeholder="0.00 - 50.00 (ไม่บังคับ)"
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
                      <Popover
                        open={breedOpen}
                        onOpenChange={setBreedOpen}
                        modal={true}
                      >
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
                        <PopoverContent className="w-75 p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="พิมพ์ค้นหาสายพันธุ์..."
                              className="h-9"
                              value={breedSearchValue}
                              onValueChange={setBreedSearchValue}
                            />
                            <CommandList className="max-h-75">
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
                      <Popover
                        open={breed2Open}
                        onOpenChange={setBreed2Open}
                        modal={true}
                      >
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
                        <PopoverContent className="w-75 p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="พิมพ์ค้นหาสายพันธุ์..."
                              className="h-9"
                              value={breed2SearchValue}
                              onValueChange={setBreed2SearchValue}
                            />
                            <CommandList className="max-h-75">
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
                    <Popover
                      open={breedOpen}
                      onOpenChange={setBreedOpen}
                      modal={true}
                    >
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
                      <PopoverContent className="w-75 p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="พิมพ์ค้นหาสายพันธุ์..."
                            className="h-9"
                            value={breedSearchValue}
                            onValueChange={setBreedSearchValue}
                          />
                          <CommandList className="max-h-75">
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
              >
                ยกเลิก
              </Button>
              <Button type="submit">เพิ่มสัตว์เลี้ยง</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
