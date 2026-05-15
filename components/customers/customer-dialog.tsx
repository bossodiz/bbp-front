"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useCustomers } from "@/lib/hooks/use-customers";
import type { Customer } from "@/lib/types";
import { formatPhoneInput, getPhoneDigits } from "@/lib/utils";
import { toast } from "sonner";

const customerSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อลูกค้า"),
  phone: z.string().refine((val) => {
    // ถ้าไม่ใส่ค่า (empty string) ให้ pass
    if (val === "") return true;
    // ถ้าใส่ค่ามา ต้อง === 10 หลัก
    return getPhoneDigits(val).length === 10;
  }, "เบอร์โทรศัพท์ต้องมี 10 หลัก"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess?: () => void;
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const { createCustomer, updateCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = customer !== null && customer !== undefined;

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (customer) {
        form.reset({
          name: customer.name.trim().startsWith("คุณ")
            ? customer.name.trimStart().slice(3)
            : customer.name,
          phone: formatPhoneInput(customer.phone),
        });
      } else {
        form.reset({
          name: "",
          phone: "",
        });
      }
    }
  }, [open, customer, form]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);
      const addHonorific = (name: string): string => {
        if (!name) return name;

        const trimmedName = name.trim();
        if (trimmedName.startsWith("คุณ")) {
          return trimmedName;
        }

        return `คุณ${trimmedName}`;
      };

      const customerData = {
        name: addHonorific(data.name),
        phone: data.phone === "" ? "0000000000" : getPhoneDigits(data.phone),
      };

      if (isEditing && customer) {
        await updateCustomer(customer.id, customerData);
        toast.success("แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว");
      } else {
        await createCustomer(customerData);
        toast.success("เพิ่มลูกค้าใหม่เรียบร้อยแล้ว");
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
            {isEditing ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "แก้ไขข้อมูลลูกค้าในระบบ"
              : "เพิ่มข้อมูลลูกค้าใหม่เข้าสู่ระบบ"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อลูกค้า</FormLabel>
                  <FormControl>
                    <div className="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted border-r border-input rounded-l-md select-none">
                        คุณ
                      </span>
                      <Input
                        placeholder="ชื่อ"
                        className="border-0 rounded-l-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
                      />
                    </div>
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
                    <div className="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="flex items-center px-3 text-muted-foreground bg-muted border-r border-input rounded-l-md">
                        <Phone className="h-4 w-4" />
                      </span>
                      <PhoneInput
                        placeholder="000-000-0000"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="border-0 rounded-l-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
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
                    : "เพิ่มลูกค้า"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
