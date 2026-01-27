"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useBookingStore } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { petTypeLabels } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const bookingSchema = z.object({
  customerName: z.string().min(1, "กรุณากรอกชื่อลูกค้า"),
  phone: z
    .string()
    .min(1, "กรุณากรอกเบอร์โทรศัพท์")
    .regex(/^[0-9-]+$/, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  petType: z.enum(["DOG", "CAT"], {
    required_error: "กรุณาเลือกประเภทสัตว์",
  }),
  serviceType: z.string().min(1, "กรุณากรอกประเภทบริการ"),
  bookingDate: z.date({
    required_error: "กรุณาเลือกวันที่",
  }),
  bookingTime: z.string().min(1, "กรุณาเลือกเวลา"),
  note: z.string().optional(),
  hasDeposit: z.boolean(),
  depositAmount: z.coerce.number().min(0).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: Booking | null;
  defaultDate?: Date;
}

const timeSlots = [
  "09:00",
  "09:30",
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
];

export function BookingDialog({
  open,
  onOpenChange,
  booking,
  defaultDate,
}: BookingDialogProps) {
  const { addBooking, updateBooking } = useBookingStore();
  const isEditing = booking !== null && booking !== undefined;

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      petType: undefined,
      serviceType: "",
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
        form.reset({
          customerName: booking.customerName,
          phone: booking.phone,
          petType: booking.petType,
          serviceType: booking.serviceType,
          bookingDate: new Date(booking.bookingDate),
          bookingTime: booking.bookingTime,
          note: booking.note || "",
          hasDeposit: booking.depositStatus !== "NONE",
          depositAmount: booking.depositAmount,
        });
      } else {
        form.reset({
          customerName: "",
          phone: "",
          petType: undefined,
          serviceType: "",
          bookingDate: defaultDate || new Date(),
          bookingTime: "",
          note: "",
          hasDeposit: false,
          depositAmount: 0,
        });
      }
    }
  }, [open, booking, defaultDate, form]);

  const onSubmit = (data: BookingFormData) => {
    const bookingData = {
      customerName: data.customerName,
      phone: data.phone,
      petType: data.petType,
      serviceType: data.serviceType,
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime,
      note: data.note,
      depositAmount: data.hasDeposit ? (data.depositAmount || 0) : 0,
      depositStatus: data.hasDeposit ? ("HELD" as const) : ("NONE" as const),
    };

    if (isEditing && booking) {
      updateBooking(booking.id, bookingData);
      toast.success("แก้ไขนัดหมายเรียบร้อยแล้ว");
    } else {
      addBooking(bookingData);
      toast.success("เพิ่มนัดหมายใหม่เรียบร้อยแล้ว");
    }
    onOpenChange(false);
  };

  return (
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อลูกค้า</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น คุณสมชาย" {...field} />
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
                      <Input placeholder="081-234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="petType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทสัตว์</FormLabel>
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
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทบริการ</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น อาบน้ำ + ตัดขน" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                              !field.value && "text-muted-foreground"
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกเวลา" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                        onCheckedChange={field.onChange}
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
              >
                ยกเลิก
              </Button>
              <Button type="submit">
                {isEditing ? "บันทึก" : "เพิ่มนัดหมาย"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
