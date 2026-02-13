"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Trash2,
  Tag,
  Pencil,
  CreditCard,
  QrCode,
  Banknote,
  Check,
  Dog,
  Cat,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePOSStore,
  usePromotionStore,
  useBookingStore,
  useCustomerStore,
  useServiceConfigStore,
} from "@/lib/store";
import type { PaymentMethod, Booking } from "@/lib/types";
import { paymentMethodLabels } from "@/lib/types";
import { cn, formatPhoneDisplay } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export function POSCart() {
  const {
    cart,
    removeFromCart,
    updateCartItemPrice,
    clearCart,
    appliedPromotionId,
    setAppliedPromotion,
    selectedBookingId,
    selectedCustomerId,
    resetPOS,
  } = usePOSStore();
  const { promotions } = usePromotionStore();
  const { getBookingById, useDeposit } = useBookingStore();
  const customers = useCustomerStore((state) => state.customers);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [customDiscount, setCustomDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  const { petTypes, getSizesForPetType } = useServiceConfigStore();

  // Prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch booking from API if selectedBookingId exists
  useEffect(() => {
    if (!selectedBookingId) {
      setBooking(null);
      return;
    }

    const fetchBooking = async () => {
      try {
        // Try local store first
        let bookingData = getBookingById(selectedBookingId);

        // If not in local store, fetch from API
        if (!bookingData) {
          const response = await fetch(`/api/bookings/${selectedBookingId}`);
          if (response.ok) {
            bookingData = await response.json();
          }
        }

        setBooking(bookingData || null);
      } catch (error) {
        setBooking(null);
      }
    };

    fetchBooking();
  }, [selectedBookingId, getBookingById]);

  useEffect(() => {
    if (editingItemId && priceInputRef.current) {
      priceInputRef.current.focus();
      priceInputRef.current.select();
    }
  }, [editingItemId]);

  useEffect(() => {
    if (showPaymentDialog && paymentMethod === "CASH" && cashInputRef.current) {
      // Delay to ensure dialog is fully rendered
      setTimeout(() => {
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      }, 100);
    }
  }, [showPaymentDialog, paymentMethod]);

  const appliedPromotion = promotions.find((p) => p.id === appliedPromotionId);
  const activePromotions = promotions.filter((p) => p.active);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.finalPrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedPromotion) return 0;
    if (appliedPromotion.type === "PERCENT") {
      return Math.round(subtotal * (appliedPromotion.value / 100));
    } else if (appliedPromotion.type === "AMOUNT") {
      return appliedPromotion.value;
    }
    return 0;
  }, [appliedPromotion, subtotal]);

  const customDiscountAmount = useMemo(() => {
    return Number(customDiscount) || 0;
  }, [customDiscount]);

  const totalDiscount = useMemo(() => {
    return discountAmount + customDiscountAmount;
  }, [discountAmount, customDiscountAmount]);

  const depositUsed = useMemo(() => {
    return booking?.depositStatus === "HELD" ? booking.depositAmount : 0;
  }, [booking]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount - depositUsed);
  }, [subtotal, totalDiscount, depositUsed]);

  const cashReceivedNum = useMemo(() => {
    return Number(cashReceived) || 0;
  }, [cashReceived]);

  const change = useMemo(() => {
    return Math.max(0, cashReceivedNum - totalAmount);
  }, [cashReceivedNum, totalAmount]);

  const handleEditPrice = (itemId: string, currentPrice: number) => {
    setEditingItemId(itemId);
    setEditingPrice(currentPrice.toString());
  };

  const handleSavePrice = () => {
    if (editingItemId) {
      const newPrice = Number(editingPrice);
      if (newPrice >= 0) {
        updateCartItemPrice(editingItemId, newPrice);
        toast.success("อัพเดตราคาเรียบร้อยแล้ว");
      }
      setEditingItemId(null);
      setEditingPrice("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSavePrice();
    }
  };

  const handlePayment = async () => {
    try {
      if (cart.length === 0) {
        toast.error("กรุณาเลือกบริการก่อน");
        return;
      }

      if (paymentMethod === "CASH" && cashReceivedNum < totalAmount) {
        toast.error("จำนวนเงินที่รับไม่เพียงพอ");
        return;
      }

      setIsSaving(true);

      // Get customer info
      const customer = selectedCustomerId
        ? customers.find((c) => c.id === selectedCustomerId)
        : null;

      // Prepare sale data
      const saleData = {
        bookingId: selectedBookingId,
        customerId: customer?.id || null,
        customerName: customer?.name || booking?.customerName || "ลูกค้าทั่วไป",
        customerPhone: customer?.phone || booking?.phone || null,
        items: cart.map((item) => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          petId: item.petId,
          petName: item.petName,
          petType: item.petType,
          originalPrice: item.originalPrice,
          finalPrice: item.finalPrice,
          isPriceModified: item.isPriceModified,
        })),
        subtotal,
        discountAmount,
        promotionId: appliedPromotionId,
        customDiscount: customDiscountAmount,
        depositUsed,
        totalAmount,
        paymentMethod,
        cashReceived: paymentMethod === "CASH" ? cashReceivedNum : null,
        change: paymentMethod === "CASH" ? change : null,
      };

      // Save to database
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "ไม่สามารถบันทึกข้อมูลได้");
      }

      // Use deposit if applicable
      const bookingToUse = selectedBookingId
        ? getBookingById(selectedBookingId)
        : null;
      if (bookingToUse?.depositStatus === "HELD") {
        useDeposit(bookingToUse.id);
      }

      toast.success("ชำระเงินและบันทึกข้อมูลสำเร็จ!");
      setShowPaymentDialog(false);
      resetPOS();
      setCashReceived("");
      setPaymentMethod("CASH");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="sticky top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            ตะกร้า
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {cart.length} รายการ
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">ยังไม่มีรายการในตะกร้า</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">
                            {item.serviceName}
                          </p>
                          {item.petId && item.petType && (
                            <>
                              {item.petType === "DOG" ? (
                                <Dog className="h-3 w-3 text-dog shrink-0" />
                              ) : (
                                <Cat className="h-3 w-3 text-cat shrink-0" />
                              )}
                              {item.petName && (
                                <span className="text-xs text-muted-foreground truncate">
                                  ({item.petName})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Input
                            ref={priceInputRef}
                            type="number"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-7 w-20 text-sm"
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
                        <div className="flex items-center gap-1 shrink-0">
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
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive h-6 w-6 p-0 shrink-0"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Promotion Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  ส่วนลด
                </label>
                <div className="space-y-1.5">
                  <Select
                    value={appliedPromotionId?.toString() || "none"}
                    onValueChange={(value) =>
                      setAppliedPromotion(
                        value === "none" ? null : Number(value),
                      )
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="เลือกโปรโมชั่น" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่ใช้โปรโมชั่น</SelectItem>
                      {activePromotions.map((promo) => (
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
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      placeholder="ลดเพิ่ม (฿)"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      className="h-9 flex-1"
                    />
                    {customDiscount && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => setCustomDiscount("")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ยอดรวม</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>โปรโมชั่น ({appliedPromotion?.name})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {customDiscountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>ส่วนลดเพิ่ม</span>
                    <span>-{formatCurrency(customDiscountAmount)}</span>
                  </div>
                )}
                {depositUsed > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>หักมัดจำ</span>
                    <span>-{formatCurrency(depositUsed)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>ยอดที่ต้องชำระ</span>
                  <span className="text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent cursor-pointer"
                  onClick={clearCart}
                >
                  ล้างตะกร้า
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  ชำระเงิน
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ชำระเงิน</DialogTitle>
            <DialogDescription>
              ยอดที่ต้องชำระ: {formatCurrency(totalAmount)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                  ref={cashInputRef}
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
                {cashReceivedNum >= totalAmount && (
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

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReceiptDialog(true)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              พิมพ์ใบเสร็จ
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handlePayment}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                {isSaving ? "กำลังบันทึก..." : "ยืนยันชำระเงิน"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>พิมพ์ใบเสร็จ</DialogTitle>
            <DialogDescription>
              ตัวอย่างใบเสร็จสำหรับกระดาษความร้อน (57×50 มม.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Receipt Preview */}
            <div className="border rounded-lg p-4 bg-white">
              <div
                className="bg-white text-black font-sans text-sm leading-relaxed"
                style={{
                  width: "57mm",
                  minHeight: "50mm",
                  fontSize: "12px",
                  lineHeight: "1.4",
                  padding: "3mm",
                  margin: "0 auto",
                  border: "1px solid #000",
                  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                }}
              >
                {/* Header */}
                <div className="text-center mb-3">
                  <div className="font-bold text-lg mb-1">
                    Bloom Bloom Paw Grooming
                  </div>
                  <div></div>
                </div>

                {/* Customer Info */}
                <div className="mb-3">
                  <div className="flex justify-between">
                    <span>ลูกค้า:</span>
                    <span className="font-medium">
                      {selectedCustomerId
                        ? customers.find((c) => c.id === selectedCustomerId)
                            ?.name || "ลูกค้าทั่วไป"
                        : booking?.customerName || "ลูกค้าทั่วไป"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>เบอร์โทร:</span>
                    <span className="font-medium">
                      {formatPhoneDisplay(
                        selectedCustomerId
                          ? customers.find((c) => c.id === selectedCustomerId)
                              ?.phone || "-"
                          : booking?.phone || "-",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>วันที่:</span>
                    <span>
                      {isMounted
                        ? format(new Date(), "dd/MM/yyyy", { locale: th })
                        : "--/--/----"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>เวลา:</span>
                    <span>
                      {isMounted
                        ? format(new Date(), "HH:mm", { locale: th })
                        : "--:--"}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-b py-2 mb-3">
                  <div className="font-medium mb-2">รายการบริการ</div>
                  {cart.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm mb-1"
                    >
                      <span className="truncate pr-1">{item.serviceName}</span>
                      <span>{formatCurrency(item.finalPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>ยอดรวม:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span>ส่วนลด:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {depositUsed > 0 && (
                    <div className="flex justify-between">
                      <span>ยอดมัดจำ:</span>
                      <span>-{formatCurrency(depositUsed)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>ยอดชำระ:</span>
                    <span>
                      {formatCurrency(totalAmount - (depositUsed || 0))}
                    </span>
                  </div>
                </div>

                {/* Thank you message */}
                <div className="text-center mt-4 text-sm">
                  <div className="font-medium mb-1">ขอบคุณที่ใช้บริการ</div>
                  <div>ติดต่อเรา: 099-191-5454</div>
                </div>
              </div>
            </div>

            {/* Print Options */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReceiptDialog(false)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement actual printing
                  toast.success("กำลังพิมพ์ใบเสร็จ...");
                  setShowReceiptDialog(false);
                }}
                className="flex-1"
              >
                พิมพ์ใบเสร็จ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
