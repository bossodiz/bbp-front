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
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  petId: z
    .number({ required_error: "กรุณาเลือกสัตว์เลี้ยง" })
    .min(1, "กรุณาเลือกสัตว์เลี้ยง"),
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
      petId: undefined,
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
          petId: booking.petId,
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
          petId: undefined,
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
    form.setValue("petId", undefined as any);
    setCustomerSearchOpen(false);
  };

  const onSubmit = async (data: HotelBookingFormData) => {
    try {
      setSubmitting(true);

      const payload = {
        customerId: data.customerId,
        petId: data.petId,
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

            {/* Pet Selection */}
            {selectedCustomer && selectedCustomer.pets.length > 0 && (
              <FormField
                control={form.control}
                name="petId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สัตว์เลี้ยงที่เข้าพัก</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(parseInt(val))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสัตว์เลี้ยง" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedCustomer.pets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id.toString()}>
                            <div className="flex items-center gap-2">
                              {pet.type === "DOG" ? (
                                <Dog className="h-4 w-4 text-dog" />
                              ) : (
                                <Cat className="h-4 w-4 text-cat" />
                              )}
                              <span>
                                {pet.name} (
                                {pet.breed || petTypeLabels[pet.type]}
                                {pet.weight ? ` - ${pet.weight} kg` : ""})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
