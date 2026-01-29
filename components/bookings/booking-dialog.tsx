"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  UserPlus,
  Plus,
  X,
} from "lucide-react";
import {
  formatPhoneDisplay,
  formatPhoneInput,
  getPhoneDigits,
  formatDateForAPI,
} from "@/lib/utils";
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
  FormDescription,
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
  CommandSeparator,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useBookings } from "@/lib/hooks/use-bookings";
import { useCustomers } from "@/lib/hooks/use-customers";
import { AddPetDialog } from "./add-pet-dialog";
import type { Booking, Customer, Pet, NewPetData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const bookingSchema = z.object({
  customerId: z.number().optional(),
  customerName: z.string().min(1, "กรุณากรอกชื่อลูกค้า"),
  phone: z
    .string()
    .min(1, "กรุณากรอกเบอร์โทรศัพท์")
    .refine(
      (val) => getPhoneDigits(val).length === 10,
      "เบอร์โทรศัพท์ต้องมี 10 หลัก",
    ),
  bookingDate: z.date({
    required_error: "กรุณาเลือกวันที่",
  }),
  bookingTime: z.string().min(1, "กรุณาเลือกเวลา"),
  note: z.string().optional(),
  hasDeposit: z.boolean(),
  depositAmount: z.coerce.number().min(0).optional(),
});

interface PetServicePair {
  petId?: number; // existing pet
  newPet?: NewPetData; // new pet
  serviceType: string;
}

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: Booking | null;
  defaultDate?: Date;
  onSuccess?: () => void;
}

const timeSlots = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

const serviceTypeOptions = ["อาบน้ำ", "อาบน้ำ + ตัดขน"];

export function BookingDialog({
  open,
  onOpenChange,
  booking,
  defaultDate,
  onSuccess,
}: BookingDialogProps) {
  const { customers, fetchCustomers } = useCustomers();
  const [submitting, setSubmitting] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [petServicePairs, setPetServicePairs] = useState<PetServicePair[]>([
    { serviceType: "" },
  ]);
  const [showNewPetDialog, setShowNewPetDialog] = useState(false);
  const [newPetDialogIndex, setNewPetDialogIndex] = useState<number>(0);
  const isEditing = booking !== null && booking !== undefined;

  // Fetch customers when dialog opens
  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open, fetchCustomers]);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerId: undefined,
      customerName: "",
      phone: "",
      bookingDate: defaultDate || new Date(),
      bookingTime: "",
      note: "",
      hasDeposit: false,
      depositAmount: 0,
    },
  });

  const watchHasDeposit = form.watch("hasDeposit");

  useEffect(() => {
    if (open) {
      if (booking) {
        // Editing existing booking
        const customer = customers.find((c) => c.id === booking.customerId);
        setSelectedCustomer(customer || null);
        setIsNewCustomer(false);

        // โหลด pets ที่มีอยู่ในการจอง
        const existingPets = booking.pets || [];
        if (existingPets.length > 0) {
          setPetServicePairs(
            existingPets.map((pet) => ({
              petId: pet.petId,
              serviceType: pet.service,
            })),
          );
        } else {
          setPetServicePairs([{ serviceType: "" }]);
        }

        // แปลง bookingTime เป็น HH:mm format (ตัด seconds ออก)
        const timeValue = booking.bookingTime.substring(0, 5);

        form.reset({
          customerId: booking.customerId,
          customerName: booking.customerName,
          phone: formatPhoneInput(booking.phone),
          bookingDate: new Date(booking.bookingDate),
          bookingTime: timeValue,
          note: booking.note || "",
          hasDeposit: booking.depositStatus !== "NONE",
          depositAmount: booking.depositAmount,
        });
      } else {
        // New booking
        setIsNewCustomer(false);
        setSelectedCustomer(null);
        setPetServicePairs([{ serviceType: "" }]);
        form.reset({
          customerId: undefined,
          customerName: "",
          phone: "",
          bookingDate: defaultDate || new Date(),
          bookingTime: "",
          note: "",
          hasDeposit: false,
          depositAmount: 0,
        });
      }
    }
  }, [open, booking, defaultDate, form, customers]);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    form.setValue("customerId", customer.id);
    form.setValue("customerName", customer.name);
    form.setValue("phone", formatPhoneInput(customer.phone));
    setCustomerSearchOpen(false);
    // รีเซ็ต pet service pairs
    setPetServicePairs([{ serviceType: "" }]);
  };

  // Handle new customer
  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setIsNewCustomer(true);
    form.setValue("customerId", undefined);
    form.setValue("customerName", "");
    form.setValue("phone", "");
    setCustomerSearchOpen(false);
    // รีเซ็ต pet service pairs
    setPetServicePairs([{ serviceType: "" }]);
  };

  // Pet service pair management
  const addPetServicePair = () => {
    setPetServicePairs([...petServicePairs, { serviceType: "" }]);
  };

  const removePetServicePair = (index: number) => {
    if (petServicePairs.length > 1) {
      setPetServicePairs(petServicePairs.filter((_, i) => i !== index));
    }
  };

  const updatePetServicePair = (
    index: number,
    updates: Partial<PetServicePair>,
  ) => {
    const newPairs = [...petServicePairs];
    newPairs[index] = { ...newPairs[index], ...updates };
    setPetServicePairs(newPairs);
  };

  const handleAddNewPetClick = (index: number) => {
    setNewPetDialogIndex(index);
    setShowNewPetDialog(true);
  };

  const handleAddNewPet = (pet: NewPetData) => {
    updatePetServicePair(newPetDialogIndex, { newPet: pet, petId: undefined });
    setShowNewPetDialog(false);
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setSubmitting(true);

      // ตรวจสอบชื่อสัตว์ซ้ำสำหรับสัตว์ใหม่ทั้งหมด (ก่อน filter)
      const newPets = petServicePairs.filter((pair) => pair.newPet);
      const petNames = new Set<string>();

      for (const pair of newPets) {
        if (pair.newPet) {
          const normalizedName = pair.newPet.name.toLowerCase().trim();
          if (petNames.has(normalizedName)) {
            toast.error(
              `มีสัตว์เลี้ยงชื่อ "${pair.newPet.name}" ซ้ำกันในรายการ`,
            );
            setSubmitting(false);
            return;
          }
          petNames.add(normalizedName);

          // ตรวจสอบกับสัตว์ที่มีอยู่ของลูกค้าแล้ว
          if (selectedCustomer) {
            const existingPet = selectedCustomer.pets.find(
              (p) => p.name.toLowerCase().trim() === normalizedName,
            );
            if (existingPet) {
              toast.error(
                `ลูกค้านี้มีสัตว์เลี้ยงชื่อ "${existingPet.name}" อยู่แล้ว`,
              );
              setSubmitting(false);
              return;
            }
          }
        }
      }

      // Validate pet service pairs
      const validPairs = petServicePairs.filter(
        (pair) => (pair.petId || pair.newPet) && pair.serviceType,
      );

      if (validPairs.length === 0) {
        toast.error("กรุณาเลือกสัตว์เลี้ยงและบริการอย่างน้อย 1 ชุด");
        setSubmitting(false);
        return;
      }

      // ใช้บริการแรกเป็น serviceType หลัก (สำหรับ backward compatibility)
      const serviceType = validPairs[0].serviceType;

      const bookingData = {
        customerId: data.customerId,
        customerName: data.customerName,
        phone: getPhoneDigits(data.phone),
        petServicePairs: validPairs, // ส่ง petServicePairs ไปให้ API
        serviceType,
        bookingDate: formatDateForAPI(data.bookingDate), // Convert Date to YYYY-MM-DD string
        bookingTime: data.bookingTime,
        note: data.note,
        depositAmount: data.hasDeposit ? data.depositAmount || 0 : 0,
        depositStatus: data.hasDeposit ? ("HELD" as const) : ("NONE" as const),
        status: "PENDING" as const,
      };

      if (isEditing && booking) {
        const response = await fetch(`/api/bookings/${booking.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "ไม่สามารถแก้ไขนัดหมายได้");
        }

        toast.success("แก้ไขนัดหมายเรียบร้อยแล้ว");
      } else {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "ไม่สามารถเพิ่มนัดหมายได้");
        }

        toast.success("เพิ่มนัดหมายใหม่เรียบร้อยแล้ว");
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error.message ||
          (isEditing ? "ไม่สามารถแก้ไขนัดหมายได้" : "ไม่สามารถเพิ่มนัดหมายได้"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "แก้ไขนัดหมาย" : "เพิ่มนัดหมายใหม่"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "แก้ไขข้อมูลการนัดหมาย"
                : "กรอกข้อมูลเพื่อสร้างนัดหมายใหม่"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Customer Selection - Only show for new bookings */}
              {!isEditing && (
                <div className="space-y-2">
                  <FormLabel>ข้อมูลลูกค้า</FormLabel>
                  <Popover
                    open={customerSearchOpen}
                    onOpenChange={setCustomerSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedCustomer
                          ? `${selectedCustomer.name} (${formatPhoneDisplay(selectedCustomer.phone)})`
                          : isNewCustomer
                            ? "ลูกค้าใหม่"
                            : "เลือกลูกค้า หรือเพิ่มลูกค้าใหม่"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="ค้นหาชื่อหรือเบอร์โทร..." />
                        <CommandList>
                          <CommandEmpty>ไม่พบข้อมูลลูกค้า</CommandEmpty>
                          <CommandGroup heading="ลูกค้าที่มีอยู่">
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={`${customer.name} ${customer.phone}`}
                                onSelect={() => handleCustomerSelect(customer)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCustomer?.id === customer.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {customer.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatPhoneDisplay(customer.phone)}
                                    {customer.pets.length > 0 &&
                                      ` • ${customer.pets.length} สัตว์เลี้ยง`}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem onSelect={handleNewCustomer}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              เพิ่มลูกค้าใหม่
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อลูกค้า</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น คุณสมชาย"
                          {...field}
                          disabled={isEditing || !isNewCustomer}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="081-234-5678"
                          value={field.value}
                          onChange={(e) => {
                            const formatted = formatPhoneInput(e.target.value);
                            field.onChange(formatted);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          disabled={isEditing || !isNewCustomer}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pet Service Pairs - แสดงเมื่อมีลูกค้า */}
              {(selectedCustomer || isNewCustomer || isEditing) && (
                <div className="space-y-4">
                  <FormLabel>สัตว์เลี้ยงที่ใช้บริการ</FormLabel>
                  {petServicePairs.map((pair, index) => {
                    // Filter out pets that are already selected in other pairs
                    const selectedPetIds = petServicePairs
                      .filter((p, i) => i !== index && p.petId)
                      .map((p) => p.petId!);

                    // รวม pet ปัจจุบันด้วย (สำหรับกรณีแก้ไข)
                    const currentPetId = pair.petId;
                    const availablePets = selectedCustomer?.pets.filter(
                      (pet) =>
                        pet.id === currentPetId ||
                        !selectedPetIds.includes(pet.id),
                    );

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex gap-2">
                          {/* Pet Selector */}
                          <div className="flex-1">
                            <Select
                              key={`pet-${index}-${pair.newPet ? pair.newPet.name : pair.petId || "empty"}`}
                              value={
                                pair.petId
                                  ? pair.petId.toString()
                                  : pair.newPet
                                    ? `new-pet-${index}`
                                    : ""
                              }
                              onValueChange={(value) => {
                                if (value === "add-new") {
                                  handleAddNewPetClick(index);
                                } else if (value.startsWith("new-pet-")) {
                                  // Already a new pet, do nothing
                                  return;
                                } else {
                                  updatePetServicePair(index, {
                                    petId: parseInt(value),
                                    newPet: undefined,
                                  });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกสัตว์เลี้ยง" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Show new pet as an item if exists */}
                                {pair.newPet && (
                                  <SelectItem
                                    value={`new-pet-${index}`}
                                    className="bg-primary/10"
                                  >
                                    {pair.newPet.name} (ใหม่)
                                  </SelectItem>
                                )}
                                {availablePets && availablePets.length > 0 ? (
                                  availablePets.map((pet) => (
                                    <SelectItem
                                      key={pet.id}
                                      value={pet.id.toString()}
                                    >
                                      {pet.name} (
                                      {pet.breed || "ไม่ระบุสายพันธุ์"})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    {selectedCustomer?.pets.length === 0
                                      ? "ไม่มีสัตว์เลี้ยง"
                                      : "สัตว์เลี้ยงถูกเลือกหมดแล้ว"}
                                  </div>
                                )}
                                <SelectItem
                                  value="add-new"
                                  className="text-primary"
                                >
                                  <div className="flex items-center">
                                    <Plus className="mr-2 h-4 w-4" />
                                    เพิ่มสัตว์เลี้ยงใหม่
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Service Type Input */}
                          <div className="flex-1">
                            <Input
                              placeholder="เลือกหรือพิมพ์บริการ"
                              value={pair.serviceType}
                              onChange={(e) =>
                                updatePetServicePair(index, {
                                  serviceType: e.target.value,
                                })
                              }
                              list={`service-options-${index}`}
                            />
                            <datalist id={`service-options-${index}`}>
                              {serviceTypeOptions.map((service) => (
                                <option key={service} value={service} />
                              ))}
                            </datalist>
                          </div>

                          {/* Remove button - show only if more than 1 pair */}
                          {petServicePairs.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePetServicePair(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add pair button */}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPetServicePair}
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      เพิ่มสัตว์เลี้ยงและบริการ
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bookingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>วันที่</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>เลือกวันที่</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bookingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เวลา</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกเวลา" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-75">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time} น.
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมายเหตุ (ไม่บังคับ)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="เช่น ชื่อสัตว์เลี้ยง, สายพันธุ์, หรือข้อมูลเพิ่มเติม"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 rounded-lg border p-4">
                <FormField
                  control={form.control}
                  name="hasDeposit"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">มัดจำ</FormLabel>
                        <FormDescription>
                          ลูกค้าโอนเงินมัดจำผ่าน QR
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue("depositAmount", 200);
                              // Focus on deposit amount input after a short delay
                              setTimeout(() => {
                                const depositInput = document.querySelector(
                                  'input[name="depositAmount"]',
                                ) as HTMLInputElement;
                                depositInput?.focus();
                                depositInput?.select();
                              }, 100);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchHasDeposit && (
                  <FormField
                    control={form.control}
                    name="depositAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>จำนวนเงินมัดจำ (บาท)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="เช่น 300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "กำลังบันทึก..."
                    : isEditing
                      ? "บันทึก"
                      : "เพิ่มนัดหมาย"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Pet Dialog - Rendered outside BookingDialog to avoid nested dialog issues */}
      {showNewPetDialog && (
        <AddPetDialog
          open={showNewPetDialog}
          onOpenChange={setShowNewPetDialog}
          onAddPet={handleAddNewPet}
        />
      )}
    </>
  );
}
