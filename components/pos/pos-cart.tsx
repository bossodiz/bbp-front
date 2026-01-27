"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Trash2,
  Tag,
  Pencil,
  CreditCard,
  QrCode,
  Banknote,
  Check,
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
} from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";
import { paymentMethodLabels } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function POSCart() {
  const {
    cart,
    removeFromCart,
    updateCartItemPrice,
    clearCart,
    appliedPromotionId,
    setAppliedPromotion,
    selectedBookingId,
    resetPOS,
  } = usePOSStore();
  const { promotions } = usePromotionStore();
  const { getBookingById, useDeposit } = useBookingStore();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashReceived, setCashReceived] = useState("");

  const booking = selectedBookingId ? getBookingById(selectedBookingId) : null;
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
  const subtotal = cart.reduce((sum, item) => sum + item.finalPrice, 0);

  let discountAmount = 0;
  if (appliedPromotion) {
    if (appliedPromotion.type === "PERCENT") {
      discountAmount = Math.round(subtotal * (appliedPromotion.value / 100));
    } else if (appliedPromotion.type === "AMOUNT") {
      discountAmount = appliedPromotion.value;
    }
  }

  const depositUsed =
    booking?.depositStatus === "HELD" ? booking.depositAmount : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount - depositUsed);
  const cashReceivedNum = Number(cashReceived) || 0;
  const change = Math.max(0, cashReceivedNum - totalAmount);

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

  const handlePayment = () => {
    if (cart.length === 0) {
      toast.error("กรุณาเลือกบริการก่อน");
      return;
    }

    if (paymentMethod === "CASH" && cashReceivedNum < totalAmount) {
      toast.error("จำนวนเงินที่รับไม่เพียงพอ");
      return;
    }

    // Use deposit if applicable
    const bookingToUse = selectedBookingId ? getBookingById(selectedBookingId) : null;
    if (bookingToUse?.depositStatus === "HELD") {
      useDeposit(bookingToUse.id);
    }

    toast.success("ชำระเงินสำเร็จ!");
    setShowPaymentDialog(false);
    resetPOS();
    setCashReceived("");
    setPaymentMethod("CASH");
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
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.serviceName}
                      </p>
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            className="h-7 w-24 text-sm"
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
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm",
                              item.isPriceModified
                                ? "text-warning font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatCurrency(item.finalPrice)}
                          </span>
                          {item.isPriceModified && (
                            <Badge variant="outline" className="text-xs">
                              แก้ไขแล้ว
                            </Badge>
                          )}
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
                      className="text-destructive hover:text-destructive"
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
                  โปรโมชั่น
                </label>
                <Select
                  value={appliedPromotionId?.toString() || "none"}
                  onValueChange={(value) =>
                    setAppliedPromotion(value === "none" ? null : Number(value))
                  }
                >
                  <SelectTrigger>
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
                    <span>ส่วนลด ({appliedPromotion?.name})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
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
                  className="flex-1 bg-transparent"
                  onClick={clearCart}
                >
                  ล้างตะกร้า
                </Button>
                <Button
                  className="flex-1"
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
                        "flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors",
                        paymentMethod === method
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
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
                  )
                )}
              </div>
            </div>

            {paymentMethod === "CASH" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">รับเงินมา (บาท)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button onClick={handlePayment}>ยืนยันชำระเงิน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
