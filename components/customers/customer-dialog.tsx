"use client";

import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { useCustomerStore } from "@/lib/store";
import type { Customer } from "@/lib/types";
import { formatPhoneInput, getPhoneDigits } from "@/lib/utils";
import { toast } from "sonner";

const customerSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อลูกค้า"),
  phone: z
    .string()
    .min(1, "กรุณากรอกเบอร์โทรศัพท์")
    .refine((val) => getPhoneDigits(val).length === 10, "เบอร์โทรศัพท์ต้องมี 10 หลัก"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
}: CustomerDialogProps) {
  const { addCustomer, updateCustomer } = useCustomerStore();
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
          name: customer.name,
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

  const onSubmit = (data: CustomerFormData) => {
    const customerData = {
      name: data.name,
      phone: getPhoneDigits(data.phone), // Store only digits
    };
    
    if (isEditing && customer) {
      updateCustomer(customer.id, customerData);
      toast.success("แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว");
    } else {
      addCustomer(customerData);
      toast.success("เพิ่มลูกค้าใหม่เรียบร้อยแล้ว");
    }
    onOpenChange(false);
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
                    <Input placeholder="เช่น คุณสมชาย ใจดี" {...field} />
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
                      placeholder="เช่น 081-234-5678"
                      value={field.value}
                      onChange={(e) => {
                        const formatted = formatPhoneInput(e.target.value);
                        field.onChange(formatted);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
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
                {isEditing ? "บันทึก" : "เพิ่มลูกค้า"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
