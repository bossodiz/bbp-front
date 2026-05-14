"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Dog,
  Cat,
  Clock,
  Phone,
  Pencil,
  Trash2,
  Ban,
  ShoppingCart,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookingDialog } from "./booking-dialog";
import { useBookings } from "@/lib/hooks/use-bookings";
import type { Booking, DepositStatus } from "@/lib/types";
import { petTypeLabels, depositStatusLabels } from "@/lib/types";
import { cn, formatPhoneDisplay, getBangkokDateString } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const depositStatusColors: Record<DepositStatus, string> = {
  NONE: "bg-muted text-muted-foreground",
  HELD: "bg-primary/10 text-primary",
  USED: "bg-success/10 text-success",
  FORFEITED: "bg-destructive/10 text-destructive",
};

export function BookingList({
  showCompleted = false,
}: {
  showCompleted?: boolean;
}) {
  const router = useRouter();
  const today = getBangkokDateString();
  const {
    bookings,
    loading,
    updateBooking,
    cancelBooking,
    forfeitDeposit,
    fetchBookings,
  } = useBookings({ fromDate: today });
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [cancelingBooking, setCancelingBooking] = useState<Booking | null>(
    null,
  );
  const [forfeitingBooking, setForfeitingBooking] = useState<Booking | null>(
    null,
  );

  // Helper to get pets for a booking and filter by completion status
  const groupedBookings = useMemo(() => {
    // Filter bookings based on showCompleted prop
    const filteredBookings = showCompleted
      ? bookings
      : bookings.filter(
          (booking) =>
            booking.status !== "COMPLETED" && booking.status !== "CANCELLED",
        );

    return filteredBookings.reduce(
      (acc, booking) => {
        const dateKey = format(new Date(booking.bookingDate), "yyyy-MM-dd");
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(booking);
        return acc;
      },
      {} as Record<string, Booking[]>,
    );
  }, [bookings, showCompleted]);

  // Sort by date
  const sortedDates = useMemo(() => {
    return Object.keys(groupedBookings).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
  }, [groupedBookings]);

  const handleCancel = async () => {
    if (cancelingBooking) {
      try {
        await cancelBooking(cancelingBooking.id);
        toast.success("ยกเลิกนัดหมายเรียบร้อยแล้ว");
        setCancelingBooking(null);
      } catch (error: any) {
        toast.error(error.message || "ไม่สามารถยกเลิกนัดหมายได้");
      }
    }
  };

  const handleForfeit = async () => {
    if (forfeitingBooking) {
      try {
        await forfeitDeposit(forfeitingBooking.id);
        toast.success("ยึดมัดจำเรียบร้อยแล้ว");
        setForfeitingBooking(null);
      } catch (error: any) {
        toast.error(error.message || "ไม่สามารถยึดมัดจำได้");
      }
    }
  };

  const handleOpenPOS = (booking: Booking) => {
    router.push(`/pos?bookingId=${booking.id}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-2">กำลังโหลด...</p>
        </CardContent>
      </Card>
    );
  }
  if (Object.keys(groupedBookings).length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {showCompleted
              ? "ยังไม่มีนัดหมายในระบบ"
              : "ยังไม่มีนัดหมายที่รอดำเนินการ"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {sortedDates.map((dateKey) => {
          const dateBookings = groupedBookings[dateKey];
          const date = new Date(dateKey);
          const isToday =
            format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium">
                  {format(date, "EEEE d MMMM yyyy", { locale: th })}
                </h3>
                {isToday && (
                  <Badge variant="default" className="text-xs">
                    วันนี้
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {dateBookings.length} นัดหมาย
                </Badge>
                {/* แสดงสถิติสถานะ */}
                {showCompleted && (
                  <>
                    <Badge
                      variant="outline"
                      className="text-xs bg-success/10 text-success"
                    >
                      เสร็จแล้ว{" "}
                      {
                        dateBookings.filter((b) => b.status === "COMPLETED")
                          .length
                      }
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs bg-destructive/10 text-destructive"
                    >
                      ยกเลิก{" "}
                      {
                        dateBookings.filter((b) => b.status === "CANCELLED")
                          .length
                      }
                    </Badge>
                  </>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {dateBookings
                  .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime))
                  .map((booking) => {
                    const pets = booking.pets || [];

                    const isDisabled =
                      booking.status === "COMPLETED" ||
                      booking.status === "CANCELLED";

                    return (
                      <Card
                        key={booking.id}
                        className={cn(
                          "overflow-hidden flex flex-col",
                          isDisabled && "opacity-50 bg-muted/50",
                        )}
                      >
                        <CardContent className="py-0 px-4 flex-1 flex flex-col">
                          <div className="flex-1">
                            {/* Header: Customer name, phone, time */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium text-base">
                                  {booking.customerName}
                                </p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>
                                    {booking.phone
                                      ? formatPhoneDisplay(booking.phone)
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{booking.bookingTime}</span>
                              </div>
                            </div>

                            {/* Pet list with services */}
                            {pets.length > 0 && (
                              <div className="space-y-1 mb-3">
                                {pets.map((pet) => (
                                  <div
                                    key={pet.petId}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    {pet.type === "DOG" ? (
                                      <Dog className="h-4 w-4 text-dog shrink-0" />
                                    ) : (
                                      <Cat className="h-4 w-4 text-cat shrink-0" />
                                    )}
                                    <span className="font-medium">
                                      {pet.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {pet.breed || "ไม่ระบุสายพันธุ์"}
                                    </span>
                                    <span className="ml-auto text-muted-foreground">
                                      {pet.service}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Note */}
                            {booking.note && (
                              <div className="mb-3">
                                <p className="text-sm">
                                  <span className="font-medium">หมายเหตุ:</span>{" "}
                                  {booking.note}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Footer: Status, Deposit status and actions */}
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-2">
                              {/* Deposit Badge */}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  depositStatusColors[booking.depositStatus],
                                )}
                              >
                                {booking.depositStatus === "NONE"
                                  ? "ไม่มีมัดจำ"
                                  : `${formatCurrency(booking.depositAmount)} (${depositStatusLabels[booking.depositStatus]})`}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isDisabled &&
                                (booking.depositStatus === "NONE" ||
                                  booking.depositStatus === "HELD") && (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleOpenPOS(booking)}
                                  >
                                    <ShoppingCart className="mr-1 h-3 w-3" />
                                    เปิด POS
                                  </Button>
                                )}

                              {!isDisabled ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      จัดการ
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => setEditingBooking(booking)}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      แก้ไข
                                    </DropdownMenuItem>
                                    {booking.depositStatus === "HELD" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setForfeitingBooking(booking)
                                        }
                                        className="text-destructive"
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        ยึดมัดจำ
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setCancelingBooking(booking)
                                      }
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      ยกเลิกนัดหมาย
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <Button variant="outline" size="sm" disabled>
                                  ไม่สามารถจัดการได้
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Booking Dialog */}
      <BookingDialog
        open={editingBooking !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingBooking(null);
          }
        }}
        booking={editingBooking}
        onSuccess={fetchBookings}
      />

      {/* Cancel Confirmation */}
      <AlertDialog
        open={cancelingBooking !== null}
        onOpenChange={(open) => !open && setCancelingBooking(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการยกเลิกนัดหมาย</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการยกเลิกนัดหมายของ &quot;{cancelingBooking?.customerName}
              &quot; ใช่หรือไม่? นัดหมายจะถูกเปลี่ยนสถานะเป็น "ยกเลิกแล้ว"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ยกเลิกนัดหมาย
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forfeit Deposit Confirmation */}
      <AlertDialog
        open={forfeitingBooking !== null}
        onOpenChange={(open) => !open && setForfeitingBooking(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการยึดมัดจำ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการยึดมัดจำ{" "}
              {formatCurrency(forfeitingBooking?.depositAmount || 0)} ของ &quot;
              {forfeitingBooking?.customerName}&quot; ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForfeit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ยึดมัดจำ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
