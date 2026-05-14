"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Banknote,
  QrCode,
  CreditCard,
  Check,
  Pencil,
  Dog,
  Cat,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHotel } from "@/lib/hooks/use-hotel";
import { useServices } from "@/lib/hooks/use-services";
import { usePromotions } from "@/lib/hooks/use-promotions";
import { useServiceConfigContext } from "@/lib/contexts/service-config-context";
import type {
  HotelBooking,
  PaymentMethod,
  Service,
  Promotion,
} from "@/lib/types";
import { paymentMethodLabels, petTypeLabels } from "@/lib/types";
import { cn, formatDateForAPI } from "@/lib/utils";
import { toast } from "sonner";

interface CartItem {
  id: string;
  serviceId: number;
  serviceName: string;
  originalPrice: number;
  finalPrice: number;
  isPriceModified: boolean;
}

interface HotelCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: HotelBooking;
  onSuccess?: () => void;
}

export function HotelCheckoutDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: HotelCheckoutDialogProps) {
  const { checkout } = useHotel({ autoFetch: false });
  const { services, fetchServices } = useServices({ autoFetch: false });
  const { promotions } = usePromotions();
  const [checkOutDate, setCheckOutDate] = useState<Date>(new Date());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(
    null,
  );
  const [discountAmount, setDiscountAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState("");

  let petTypes: any[] = [];
  let getSizesForPetType: any = () => [];
  try {
    const ctx = useServiceConfigContext();
    petTypes = ctx.petTypes;
    getSizesForPetType = ctx.getSizesForPetType;
  } catch {
    // Context not available, proceed without it
  }

  useEffect(() => {
    if (open) {
      fetchServices();
      setCheckOutDate(new Date());
      setCart([]);
      setSelectedPromotionId(null);
      setDiscountAmount("");
      setPaymentMethod("CASH");
      setCashReceived("");
      setNote(booking.note || "");
    }
  }, [open, fetchServices, booking]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate nights
  const totalNights = useMemo(() => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = checkOutDate;
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [booking.checkInDate, checkOutDate]);

  const roomTotal = useMemo(() => {
    return booking.ratePerNight * totalNights;
  }, [booking.ratePerNight, totalNights]);

  const servicesTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.finalPrice, 0);
  }, [cart]);

  const customDiscount = useMemo(() => {
    return Number(discountAmount) || 0;
  }, [discountAmount]);

  const selectedPromotion = useMemo(() => {
    if (!selectedPromotionId) return null;
    return promotions.find((p) => p.id === selectedPromotionId) || null;
  }, [selectedPromotionId, promotions]);

  const hotelPromotions = useMemo(() => {
    return promotions.filter(
      (p) =>
        p.active && (p.applicableTo === "ALL" || p.applicableTo === "HOTEL"),
    );
  }, [promotions]);

  const promotionDiscount = useMemo(() => {
    if (!selectedPromotion) return 0;
    const subtotal = roomTotal + servicesTotal;
    if (selectedPromotion.type === "PERCENT") {
      return Math.round(subtotal * (selectedPromotion.value / 100));
    } else if (selectedPromotion.type === "AMOUNT") {
      return selectedPromotion.value;
    }
    return 0;
  }, [selectedPromotion, roomTotal, servicesTotal]);

  const totalDiscount = useMemo(() => {
    return promotionDiscount + customDiscount;
  }, [promotionDiscount, customDiscount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, roomTotal + servicesTotal - totalDiscount);
  }, [roomTotal, servicesTotal, totalDiscount]);

  const depositUsed = useMemo(() => {
    return booking.depositStatus === "HELD" ? booking.depositAmount : 0;
  }, [booking]);

  const remainingAmount = useMemo(() => {
    return Math.max(0, grandTotal - depositUsed);
  }, [grandTotal, depositUsed]);

  const cashReceivedNum = useMemo(() => {
    return Number(cashReceived) || 0;
  }, [cashReceived]);

  const change = useMemo(() => {
    return Math.max(0, cashReceivedNum - remainingAmount);
  }, [cashReceivedNum, remainingAmount]);

  // Estimate size from weight
  const estimateSizeFromWeight = useCallback(
    (weight: number | null, petTypeId: string): string | null => {
      if (weight === null || weight === undefined) return null;
      const sizesForType = getSizesForPetType(petTypeId).filter(
        (s: any) => s.active,
      );
      for (const size of sizesForType) {
        const min = size.minWeight ?? 0;
        const max = size.maxWeight ?? Infinity;
        if (weight >= min && weight <= max) return size.id;
      }
      return sizesForType[0]?.id || null;
    },
    [getSizesForPetType],
  );

  // Get available services for this pet
  const availableServices = useMemo(() => {
    const petType = booking.pets?.[0]?.type;
    if (!petType) return [];

    return services
      .filter((s) => s.active)
      .map((service) => {
        if (service.isSpecial) {
          return {
            ...service,
            displayPrice: service.specialPrice || 0,
          };
        }
        // Find price for this pet type
        const estimatedSizeId = estimateSizeFromWeight(null, petType);
        const priceInfo = service.prices.find(
          (p) =>
            p.petTypeId === petType &&
            (!estimatedSizeId || p.sizeId === estimatedSizeId),
        );
        if (!priceInfo || priceInfo.price <= 0) return null;
        return {
          ...service,
          displayPrice: priceInfo.price,
        };
      })
      .filter(Boolean) as (Service & { displayPrice: number })[];
  }, [services, booking.pets, estimateSizeFromWeight]);

  const addServiceToCart = (service: Service & { displayPrice: number }) => {
    const isInCart = cart.some((item) => item.serviceId === service.id);
    if (isInCart) {
      toast.error("บริการนี้อยู่ในรายการแล้ว");
      return;
    }

    setCart([
      ...cart,
      {
        id: `svc-${service.id}-${Date.now()}`,
        serviceId: service.id,
        serviceName: service.name,
        originalPrice: service.displayPrice,
        finalPrice: service.displayPrice,
        isPriceModified: false,
      },
    ]);
    toast.success(`เพิ่ม "${service.name}" แล้ว`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const handleEditPrice = (itemId: string, currentPrice: number) => {
    setEditingItemId(itemId);
    setEditingPrice(currentPrice.toString());
  };

  const handleSavePrice = () => {
    if (editingItemId) {
      const newPrice = Number(editingPrice);
      if (newPrice >= 0) {
        setCart(
          cart.map((item) =>
            item.id === editingItemId
              ? {
                  ...item,
                  finalPrice: newPrice,
                  isPriceModified: newPrice !== item.originalPrice,
                }
              : item,
          ),
        );
      }
      setEditingItemId(null);
      setEditingPrice("");
    }
  };

  const handleCheckout = async () => {
    try {
      if (paymentMethod === "CASH" && cashReceivedNum < remainingAmount) {
        toast.error("จำนวนเงินที่รับไม่เพียงพอ");
        return;
      }

      setSubmitting(true);

      await checkout(booking.id, {
        checkOutDate: formatDateForAPI(checkOutDate),
        additionalServices: cart.map((item) => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          originalPrice: item.originalPrice,
          finalPrice: item.finalPrice,
          isPriceModified: item.isPriceModified,
        })),
        discountAmount: promotionDiscount,
        paymentMethod,
        cashReceived: paymentMethod === "CASH" ? cashReceivedNum : undefined,
        note: note || undefined,
        promotionId: selectedPromotionId || undefined,
        customDiscount: customDiscount || undefined,
      });

      toast.success("Checkout สำเร็จ!");
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout - รับสัตว์เลี้ยงกลับ</DialogTitle>
          <DialogDescription>
            {booking.pets?.[0]?.name} ({booking.pets?.[0]?.breed}) ของ {booking.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Info */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">สัตว์เลี้ยง</p>
              <div className="flex items-center gap-2 font-medium">
                {booking.pets?.[0]?.type === "DOG" ? (
                  <Dog className="h-4 w-4 text-dog" />
                ) : (
                  <Cat className="h-4 w-4 text-cat" />
                )}
                {booking.pets?.[0]?.name}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">วันเข้าพัก</p>
              <p className="font-medium">
                {format(new Date(booking.checkInDate), "PPP", { locale: th })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ราคาต่อคืน</p>
              <p className="font-medium">
                {formatCurrency(booking.ratePerNight)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">มัดจำ</p>
              <p className="font-medium">
                {booking.depositAmount > 0
                  ? formatCurrency(booking.depositAmount)
                  : "ไม่มี"}
              </p>
            </div>
          </div>

          {/* Check-out Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">วันรับกลับ</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(checkOutDate, "PPP", { locale: th })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOutDate}
                  onSelect={(date) => date && setCheckOutDate(date)}
                  disabled={(date) => date < new Date(booking.checkInDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground">
              จำนวน{" "}
              <span className="font-semibold text-foreground">
                {totalNights}
              </span>{" "}
              คืน = {formatCurrency(roomTotal)}
            </p>
          </div>

          <Separator />

          {/* Additional Services */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              บริการเสริม (อาบน้ำ / ตัดขน)
            </label>

            {/* Service Selection */}
            {availableServices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableServices.map((service) => {
                  const isInCart = cart.some(
                    (item) => item.serviceId === service.id,
                  );
                  return (
                    <button
                      key={service.id}
                      type="button"
                      disabled={isInCart}
                      onClick={() => addServiceToCart(service)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                        isInCart
                          ? "bg-muted/50 border-muted cursor-not-allowed opacity-60"
                          : "bg-card hover:border-primary hover:shadow-sm cursor-pointer",
                      )}
                    >
                      <span className="font-medium">{service.name}</span>
                      <span
                        className={cn(
                          "font-semibold",
                          isInCart ? "text-muted-foreground" : "text-primary",
                        )}
                      >
                        {formatCurrency(service.displayPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Cart Items */}
            {cart.length > 0 && (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm font-medium">
                      {item.serviceName}
                    </span>
                    <div className="flex items-center gap-1">
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSavePrice()
                            }
                            className="h-7 w-20 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={handleSavePrice}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {item.isPriceModified && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-sm font-medium",
                              item.isPriceModified && "text-warning",
                            )}
                          >
                            {formatCurrency(item.finalPrice)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              handleEditPrice(item.id, item.finalPrice)
                            }
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive h-6 w-6 p-0"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Promotion */}
          {hotelPromotions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">โปรโมชั่น</label>
              <Select
                value={selectedPromotionId?.toString() || "none"}
                onValueChange={(val) =>
                  setSelectedPromotionId(val === "none" ? null : parseInt(val))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกโปรโมชั่น" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่ใช้โปรโมชั่น</SelectItem>
                  {hotelPromotions.map((promo) => (
                    <SelectItem key={promo.id} value={promo.id.toString()}>
                      {promo.name} (
                      {promo.type === "PERCENT"
                        ? `ลด ${promo.value}%`
                        : `ลด ${formatCurrency(promo.value)}`}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Discount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">ส่วนลดเพิ่มเติม (บาท)</label>
            <Input
              type="number"
              placeholder="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium">หมายเหตุ</label>
            <Textarea
              placeholder="หมายเหตุเพิ่มเติม..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                ค่าห้องพัก ({totalNights} คืน ×{" "}
                {formatCurrency(booking.ratePerNight)})
              </span>
              <span>{formatCurrency(roomTotal)}</span>
            </div>
            {servicesTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  บริการเสริม ({cart.length} รายการ)
                </span>
                <span>{formatCurrency(servicesTotal)}</span>
              </div>
            )}
            {promotionDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>โปรโมชั่น ({selectedPromotion?.name})</span>
                <span>-{formatCurrency(promotionDiscount)}</span>
              </div>
            )}
            {customDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>ส่วนลดเพิ่มเติม</span>
                <span>-{formatCurrency(customDiscount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>ยอดรวมทั้งหมด</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            {depositUsed > 0 && (
              <div className="flex justify-between text-primary">
                <span>หักมัดจำ</span>
                <span>-{formatCurrency(depositUsed)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>ยอดที่ต้องชำระ</span>
              <span className="text-primary">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium">วิธีการชำระเงิน</label>
            <div className="grid grid-cols-3 gap-2">
              {(["CASH", "QR", "CREDIT_CARD"] as PaymentMethod[]).map(
                (method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer",
                      paymentMethod === method
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/30",
                    )}
                  >
                    {method === "CASH" && <Banknote className="h-6 w-6" />}
                    {method === "QR" && <QrCode className="h-6 w-6" />}
                    {method === "CREDIT_CARD" && (
                      <CreditCard className="h-6 w-6" />
                    )}
                    <span className="text-xs">
                      {paymentMethodLabels[method]}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>

          {paymentMethod === "CASH" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">รับเงินมา (บาท)</label>
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                placeholder="0"
                value={cashReceived}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  setCashReceived(value);
                }}
                className="text-lg font-semibold"
              />
              {cashReceivedNum >= remainingAmount && cashReceivedNum > 0 && (
                <div className="flex justify-between p-3 rounded-lg bg-success/10 text-success">
                  <span className="font-medium">เงินทอน</span>
                  <span className="font-semibold">
                    {formatCurrency(change)}
                  </span>
                </div>
              )}
            </div>
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
          <Button type="button" onClick={handleCheckout} disabled={submitting}>
            {submitting ? "กำลังบันทึก..." : "ยืนยัน Checkout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
