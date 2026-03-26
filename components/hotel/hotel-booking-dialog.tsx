"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Check, ChevronsUpDown, Dog, Cat } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Calendar,
  Input,
  Textarea,
  Button,
  Switch,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useCustomers } from "@/lib/hooks/use-customers";
import { useHotel } from "@/lib/hooks/use-hotel";
import type { HotelBooking, Customer } from "@/lib/types";
import { cn, formatPhoneDisplay, formatDateForAPI } from "@/lib/utils";
import { petTypeLabels } from "@/lib/types";
import { toast } from "sonner";

const hotelBookingSchema = z.object({
  customerId: z
    .number({ required_error: "กรุณาเลือกลูกค้า" })
    .min(1, "กรุณาเลือกลูกค้า"),
  petIds: z.array(z.number()).min(1, "กรุณาเลือกสัตว์เลี้ยงอย่างน้อย 1 ตัว"),
  checkInDate: z.date({ required_error: "กรุณาเลือกวันเข้าพัก" }),
  ratePerNight: z.coerce
    .number({ required_error: "กรุณาระบุราคาต่อคืน" })
    .min(1, "ราคาต่อคืนต้องมากกว่า 0"),
  hasDeposit: z.boolean(),
  depositAmount: z.coerce.number().min(0).optional(),
  note: z.string().optional(),
});

type HotelBookingFormData = z.infer<typeof hotelBookingSchema>;

interface HotelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: HotelBooking | null;
  onSuccess?: () => void;
}

export function HotelBookingDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: HotelBookingDialogProps) {
  const { customers, fetchCustomers } = useCustomers();
  const { createBooking, updateBooking } = useHotel({ autoFetch: false });
  const [submitting, setSubmitting] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const isEditing = booking !== null && booking !== undefined;

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open, fetchCustomers]);

  const form = useForm<HotelBookingFormData>({
    resolver: zodResolver(hotelBookingSchema),
    defaultValues: {
      customerId: undefined,
      petIds: [],
      checkInDate: new Date(),
      ratePerNight: 300,
      hasDeposit: true,
      depositAmount: 200,
      note: "",
    },
  });

  const watchHasDeposit = form.watch("hasDeposit");
  const watchCustomerId = form.watch("customerId");

  useEffect(() => {
    if (open) {
      if (booking) {
        const customer = customers.find((c) => c.id === booking.customerId);
        setSelectedCustomer(customer || null);

        form.reset({
          customerId: booking.customerId,
          petIds: booking.pets?.map((p) => p.id).filter(Boolean) || [],
          checkInDate: new Date(booking.checkInDate),
          ratePerNight: booking.ratePerNight,
          hasDeposit: booking.depositAmount > 0,
          depositAmount: booking.depositAmount,
          note: booking.note || "",
        });
      } else {
        setSelectedCustomer(null);
        form.reset({
          customerId: undefined,
          petIds: [],
          checkInDate: new Date(),
          ratePerNight: 300,
          hasDeposit: true,
          depositAmount: 200,
          note: "",
        });
      }
    }
  }, [open, booking, form, customers]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setValue("customerId", customer.id);
    form.setValue("petIds", []);
    setCustomerSearchOpen(false);
  };

  const onSubmit = async (data: HotelBookingFormData) => {
    try {
      setSubmitting(true);

      const payload = {
        customerId: data.customerId,
        petIds: data.petIds,
        checkInDate: formatDateForAPI(data.checkInDate),
        ratePerNight: data.ratePerNight,
        depositAmount: data.hasDeposit ? data.depositAmount || 0 : 0,
        note: data.note || "",
      };

      if (isEditing && booking) {
        await updateBooking(booking.id, payload);
        toast.success("แก้ไขการจองเรียบร้อยแล้ว");
      } else {
        await createBooking(payload);
        toast.success("สร้างการจองโรงแรมเรียบร้อยแล้ว");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "แก้ไขการจองโรงแรม" : "จองโรงแรมสัตว์เลี้ยง"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "แก้ไขข้อมูลการจองโรงแรม"
              : "กรอกข้อมูลเพื่อจองห้องพักสัตว์เลี้ยง"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <FormLabel>ข้อมูลลูกค้า</FormLabel>
              <Popover
                open={customerSearchOpen}
                onOpenChange={setCustomerSearchOpen}
                modal={true}
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
                      : "เลือกลูกค้า"}
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
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Pet Selection - Multiple */}
            {selectedCustomer && selectedCustomer.pets.length > 0 && (
              <FormField
                control={form.control}
                name="petIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      สัตว์เลี้ยงที่เข้าพัก (เลือกได้หลายตัว)
                    </FormLabel>
                    <FormDescription>
                      เลือกสัตว์เลี้ยงที่จะเข้าพักห้องเดียวกัน
                    </FormDescription>
                    <div className="space-y-2">
                      {selectedCustomer.pets.map((pet) => {
                        const isSelected =
                          field.value?.includes(pet.id) || false;
                        return (
                          <div
                            key={pet.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                            )}
                            onClick={() => {
                              const current = field.value || [];
                              if (isSelected) {
                                field.onChange(
                                  current.filter((id) => id !== pet.id),
                                );
                              } else {
                                field.onChange([...current, pet.id]);
                              }
                            }}
                          >
                            <div
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded border-2",
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground",
                              )}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                            <div
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                                pet.type === "DOG"
                                  ? "bg-dog/10 text-dog"
                                  : "bg-cat/10 text-cat",
                              )}
                            >
                              {pet.type === "DOG" ? (
                                <Dog className="h-5 w-5" />
                              ) : (
                                <Cat className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{pet.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {pet.breed || petTypeLabels[pet.type]}
                                {pet.weight ? ` • ${pet.weight} kg` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Check-in Date */}
            <FormField
              control={form.control}
              name="checkInDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>วันเข้าพัก</FormLabel>
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
                            format(field.value, "PPP", { locale: th })
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rate per night */}
            <FormField
              control={form.control}
              name="ratePerNight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ราคาต่อคืน (บาท)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="350" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deposit */}
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="hasDeposit"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">มัดจำ</FormLabel>
                      <FormDescription>
                        ลูกค้าชำระเงินมัดจำล่วงหน้า
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue("depositAmount", 200);
                            setTimeout(() => {
                              const input = document.querySelector(
                                'input[name="depositAmount"]',
                              ) as HTMLInputElement;
                              input?.focus();
                              input?.select();
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
                          placeholder="200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ (ไม่บังคับ)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="เช่น อาหารพิเศษ, ยาที่ต้องให้, ข้อควรระวัง"
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
                disabled={submitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "กำลังบันทึก..."
                  : isEditing
                    ? "บันทึก"
                    : "จองโรงแรม"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
