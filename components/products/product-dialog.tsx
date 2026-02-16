"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useProducts } from "@/lib/hooks/use-products";
import type { Product } from "@/lib/types";
import { productCategoryOptions } from "@/lib/types";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().min(0, "ราคาต้องมากกว่าหรือเท่ากับ 0"),
  cost: z.coerce.number().min(0, "ราคาทุนต้องมากกว่าหรือเท่ากับ 0"),
  stockQuantity: z.coerce.number().int().min(0, "จำนวนต้องมากกว่าหรือเท่ากับ 0"),
  minStock: z.coerce.number().int().min(0, "จำนวนขั้นต่ำต้องมากกว่าหรือเท่ากับ 0"),
  unit: z.string().min(1, "กรุณาระบุหน่วยนับ"),
  active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
}: ProductDialogProps) {
  const { addProduct, updateProduct } = useProducts({ autoFetch: false });
  const [submitting, setSubmitting] = useState(false);
  const isEditing = product !== null && product !== undefined;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      category: undefined,
      price: 0,
      cost: 0,
      stockQuantity: 0,
      minStock: 0,
      unit: "ชิ้น",
      active: true,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      if (product) {
        form.reset({
          name: product.name,
          sku: product.sku || "",
          description: product.description || "",
          category: product.category || undefined,
          price: product.price,
          cost: product.cost,
          stockQuantity: product.stockQuantity,
          minStock: product.minStock,
          unit: product.unit,
          active: product.active,
        });
      } else {
        form.reset({
          name: "",
          sku: "",
          description: "",
          category: undefined,
          price: 0,
          cost: 0,
          stockQuantity: 0,
          minStock: 0,
          unit: "ชิ้น",
          active: true,
        });
      }
    }
  }, [open, product, form]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSubmitting(true);
      const productData = {
        name: data.name,
        sku: data.sku || undefined,
        description: data.description || undefined,
        category: data.category || undefined,
        price: data.price,
        cost: data.cost,
        stockQuantity: data.stockQuantity,
        minStock: data.minStock,
        unit: data.unit,
        active: data.active,
      };

      if (isEditing && product) {
        await updateProduct(product.id, productData);
        toast.success("แก้ไขสินค้าเรียบร้อยแล้ว");
      } else {
        await addProduct(productData as any);
        toast.success("เพิ่มสินค้าใหม่เรียบร้อยแล้ว");
      }

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
            {isEditing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "แก้ไขข้อมูลสินค้าที่เลือก"
              : "กรอกข้อมูลสินค้าที่ต้องการเพิ่ม"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อสินค้า *</FormLabel>
                  <FormControl>
                    <Input placeholder="เช่น อาหารสุนัข Royal Canin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสสินค้า (SKU)</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น RC-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมวดหมู่</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหมวดหมู่" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productCategoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รายละเอียด</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="รายละเอียดสินค้า..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคาขาย (บาท) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคาทุน (บาท)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนในสต็อก</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนขั้นต่ำ</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หน่วยนับ</FormLabel>
                    <FormControl>
                      <Input placeholder="ชิ้น" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">สถานะ</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      เปิดหรือปิดการขายสินค้านี้
                    </p>
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
                    ? "บันทึกการแก้ไข"
                    : "เพิ่มสินค้า"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
