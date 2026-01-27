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
import { useBookingStore } from "@/lib/store";
import type { Booking, DepositStatus } from "@/lib/types";
import { petTypeLabels, depositStatusLabels } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const depositStatusColors: Record<DepositStatus, string> = {
  NONE: "bg-muted text-muted-foreground",
  HELD: "bg-primary/10 text-primary",
  USED: "bg-success/10 text-success",
  FORFEITED: "bg-destructive/10 text-destructive",
};

export function BookingList() {
  const router = useRouter();
  const { bookings, deleteBooking, forfeitDeposit } = useBookingStore();
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [forfeitingBooking, setForfeitingBooking] = useState<Booking | null>(
    null,
  );

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    return bookings.reduce(
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
  }, [bookings]);

  // Sort by date
  const sortedDates = useMemo(() => {
    return Object.keys(groupedBookings).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
  }, [groupedBookings]);

  const handleDelete = () => {
    if (deletingBooking) {
      deleteBooking(deletingBooking.id);
      toast.success("ลบนัดหมายเรียบร้อยแล้ว");
      setDeletingBooking(null);
    }
  };

  const handleForfeit = () => {
    if (forfeitingBooking) {
      forfeitDeposit(forfeitingBooking.id);
      toast.success("ยึดมัดจำเรียบร้อยแล้ว");
      setForfeitingBooking(null);
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

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">ยังไม่มีนัดหมายในระบบ</p>
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
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {dateBookings
                  .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime))
                  .map((booking) => (
                    <Card key={booking.id} className="overflow-hidden h-full">
                      <CardContent className="p-4 h-full flex flex-col">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                              booking.petType === "DOG"
                                ? "bg-dog/10 text-dog"
                                : "bg-cat/10 text-cat",
                            )}
                          >
                            {booking.petType === "DOG" ? (
                              <Dog className="h-5 w-5" />
                            ) : (
                              <Cat className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {booking.customerName}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{booking.phone}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.bookingTime}</span>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              บริการ:
                            </span>
                            <span className="text-sm font-medium">
                              {booking.serviceType}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              มัดจำ:
                            </span>
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
                          {booking.note && (
                            <p className="text-xs text-muted-foreground border-t pt-2">
                              {booking.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t mt-auto">
                          {(booking.depositStatus === "NONE" ||
                            booking.depositStatus === "HELD") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPOS(booking)}
                            >
                              <ShoppingCart className="mr-1 h-3 w-3" />
                              เปิด POS
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
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
                                  onClick={() => setForfeitingBooking(booking)}
                                  className="text-destructive"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  ยึดมัดจำ
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingBooking(booking)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                ลบนัดหมาย
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Booking Dialog */}
      <BookingDialog
        open={editingBooking !== null}
        onOpenChange={(open) => !open && setEditingBooking(null)}
        booking={editingBooking}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deletingBooking !== null}
        onOpenChange={(open) => !open && setDeletingBooking(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบนัดหมาย</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบนัดหมายของ &quot;{deletingBooking?.customerName}&quot;
              ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
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
