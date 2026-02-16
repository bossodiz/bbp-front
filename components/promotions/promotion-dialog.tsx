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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePromotions } from "@/lib/hooks/use-promotions";
import { useServices } from "@/lib/hooks/use-services";
import type { Promotion, PromotionType, ApplicableTo } from "@/lib/types";
import { promotionTypeLabels, applicableToLabels } from "@/lib/types";
import { toast } from "sonner";

const promotionSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อโปรโมชั่น"),
    type: z.enum(["PERCENT", "AMOUNT", "FREE_SERVICE"], {
      required_error: "กรุณาเลือกประเภทโปรโมชั่น",
    }),
    value: z.coerce.number().min(0, "ค่าต้องมากกว่าหรือเท่ากับ 0").optional(),
    freeServiceId: z.coerce.number().optional(),
    applicableTo: z.enum(["ALL", "SERVICE", "HOTEL", "PRODUCT"]),
    active: z.boolean(),
  })
  .refine(
    (data) => {
      // If type is PERCENT or AMOUNT, value is required
      if (
        (data.type === "PERCENT" || data.type === "AMOUNT") &&
        (data.value === undefined || data.value === null)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "กรุณากรอกค่าส่วนลด",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      // If type is FREE_SERVICE, freeServiceId is required
      if (data.type === "FREE_SERVICE" && !data.freeServiceId) {
        return false;
      }
      return true;
    },
    {
      message: "กรุณาเลือกบริการที่แถม",
      path: ["freeServiceId"],
    },
  );

type PromotionFormData = z.infer<typeof promotionSchema>;

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion | null;
}

export function PromotionDialog({
  open,
  onOpenChange,
  promotion,
}: PromotionDialogProps) {
  const { addPromotion, updatePromotion } = usePromotions();
  const { services } = useServices({ autoFetch: true });
  const [submitting, setSubmitting] = useState(false);
  const isEditing = promotion !== null && promotion !== undefined;

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: "",
      type: undefined,
      value: 0,
      freeServiceId: undefined,
      applicableTo: "ALL" as ApplicableTo,
      active: true,
    },
    mode: "onChange",
  });

  const watchType = form.watch("type");

  useEffect(() => {
    if (open) {
      if (promotion) {
        form.reset({
          name: promotion.name,
          type: promotion.type,
          value: promotion.value,
          freeServiceId: promotion.freeServiceId,
          applicableTo: promotion.applicableTo || "ALL",
          active: promotion.active,
        });
      } else {
        form.reset({
          name: "",
          type: undefined,
          value: 0,
          freeServiceId: undefined,
          applicableTo: "ALL",
          active: true,
        });
      }
    }
  }, [open, promotion, form]);

  const onSubmit = async (data: PromotionFormData) => {
    try {
      setSubmitting(true);
      const promotionData = {
        name: data.name,
        type: data.type as PromotionType,
        value: data.type === "FREE_SERVICE" ? 0 : (data.value ?? 0),
        freeServiceId:
          data.type === "FREE_SERVICE" ? data.freeServiceId : undefined,
        applicableTo: data.applicableTo as ApplicableTo,
        active: data.active,
      };

      if (isEditing && promotion) {
        await updatePromotion(promotion.id, promotionData);
        toast.success("แก้ไขโปรโมชั่นเรียบร้อยแล้ว");
      } else {
        await addPromotion(promotionData);
        toast.success("เพิ่มโปรโมชั่นใหม่เรียบร้อยแล้ว");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        isEditing ? "ไม่สามารถแก้ไขโปรโมชั่นได้" : "ไม่สามารถเพิ่มโปรโมชั่นได้",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่น"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "แก้ไขข้อมูลโปรโมชั่นในระบบ"
              : "เพิ่มโปรโมชั่นใหม่เข้าสู่ระบบ"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อโปรโมชั่น</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น ลด 10% สำหรับลูกค้าใหม่"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ประเภทโปรโมชั่น</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        Object.keys(promotionTypeLabels) as Array<
                          keyof typeof promotionTypeLabels
                        >
                      ).map((key) => (
                        <SelectItem key={key} value={key}>
                          {promotionTypeLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === "PERCENT" && (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เปอร์เซ็นต์ส่วนลด (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="เช่น 10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchType === "AMOUNT" && (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนเงินส่วนลด (บาท)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="เช่น 50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="applicableTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ใช้ได้กับ</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        Object.keys(applicableToLabels) as Array<
                          keyof typeof applicableToLabels
                        >
                      ).map((key) => (
                        <SelectItem key={key} value={key}>
                          {applicableToLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === "FREE_SERVICE" && (
              <FormField
                control={form.control}
                name="freeServiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>บริการที่แถม</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกบริการ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id.toString()}
                          >
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">สถานะ</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      เปิดหรือปิดการใช้งานโปรโมชั่นนี้
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
                    ? "บันทึก"
                    : "เพิ่มโปรโมชั่น"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
