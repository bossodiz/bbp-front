"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Dog,
  Cat,
  Phone,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Ban,
  Calendar,
  Loader2,
  Clock,
  BedDouble,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { HotelBookingDialog } from "./hotel-booking-dialog";
import { useHotel } from "@/lib/hooks/use-hotel";
import { usePOSStore } from "@/lib/store";
import type {
  HotelBooking,
  HotelBookingStatus,
  DepositStatus,
} from "@/lib/types";
import {
  hotelStatusLabels,
  depositStatusLabels,
  petTypeLabels,
} from "@/lib/types";
import { cn, formatPhoneDisplay } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<HotelBookingStatus, string> = {
  RESERVED: "bg-info/10 text-info border-info/30",
  CHECKED_IN: "bg-warning/10 text-warning border-warning/30",
  CHECKED_OUT: "bg-success/10 text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

const depositStatusColors: Record<DepositStatus, string> = {
  NONE: "bg-muted text-muted-foreground",
  HELD: "bg-primary/10 text-primary",
  USED: "bg-success/10 text-success",
  FORFEITED: "bg-destructive/10 text-destructive",
};

interface HotelBookingListProps {
  showAll?: boolean;
}

export function HotelBookingList({ showAll = false }: HotelBookingListProps) {
  const statusFilter = showAll ? undefined : "RESERVED,CHECKED_IN";
  const router = useRouter();
  const { setHotelBooking } = usePOSStore();
  const {
    bookings,
    loading,
    fetchBookings,
    checkIn,
    cancelBooking,
    deleteBooking,
  } = useHotel({ status: statusFilter });
  const [editingBooking, setEditingBooking] = useState<HotelBooking | null>(
    null,
  );
  const [cancelingBooking, setCancelingBooking] = useState<HotelBooking | null>(
    null,
  );
  const [deletingBooking, setDeletingBooking] = useState<HotelBooking | null>(
    null,
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateNights = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return null;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateStayingNights = (checkInDate: string) => {
    const checkIn = new Date(checkInDate);
    const now = new Date();
    const diff = now.getTime() - checkIn.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleCheckIn = async (booking: HotelBooking) => {
    try {
      await checkIn(booking.id);
      toast.success(`${booking.petName} เช็คอินเรียบร้อยแล้ว`);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleCancel = async () => {
    if (cancelingBooking) {
      try {
        await cancelBooking(cancelingBooking.id);
        toast.success("ยกเลิกการจองเรียบร้อยแล้ว");
        setCancelingBooking(null);
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาด");
      }
    }
  };

  const handleDelete = async () => {
    if (deletingBooking) {
      try {
        await deleteBooking(deletingBooking.id);
        toast.success("ลบการจองเรียบร้อยแล้ว");
        setDeletingBooking(null);
      } catch (error: any) {
        toast.error(error.message || "เกิดข้อผิดพลาด");
      }
    }
  };

  // Group bookings by status
  const groupedBookings = useMemo(() => {
    const groups: Record<string, HotelBooking[]> = {
      CHECKED_IN: [],
      RESERVED: [],
      CHECKED_OUT: [],
      CANCELLED: [],
    };

    bookings.forEach((booking) => {
      if (groups[booking.status]) {
        groups[booking.status].push(booking);
      }
    });

    return groups;
  }, [bookings]);

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

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BedDouble className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">ยังไม่มีการจองโรงแรม</p>
        </CardContent>
      </Card>
    );
  }

  const renderBookingCard = (booking: HotelBooking) => {
    const isDisabled =
      booking.status === "CHECKED_OUT" || booking.status === "CANCELLED";
    const stayingNights =
      booking.status === "CHECKED_IN"
        ? calculateStayingNights(booking.checkInDate)
        : null;
    const totalNights = booking.checkOutDate
      ? calculateNights(booking.checkInDate, booking.checkOutDate)
      : stayingNights;

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
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {booking.petType === "DOG" ? (
                  <Dog className="h-5 w-5 text-dog" />
                ) : (
                  <Cat className="h-5 w-5 text-cat" />
                )}
                <div>
                  <p className="font-medium text-base">{booking.petName}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.petBreed}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs", statusColors[booking.status])}
              >
                {hotelStatusLabels[booking.status]}
              </Badge>
            </div>

            {/* Customer */}
            <div className="mb-3">
              <p className="text-sm font-medium">{booking.customerName}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{formatPhoneDisplay(booking.customerPhone || "")}</span>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  เข้าพัก:{" "}
                  {format(new Date(booking.checkInDate), "d MMM yyyy", {
                    locale: th,
                  })}
                </span>
              </div>
              {booking.checkOutDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    รับกลับ:{" "}
                    {format(new Date(booking.checkOutDate), "d MMM yyyy", {
                      locale: th,
                    })}
                  </span>
                </div>
              )}
              {booking.status === "CHECKED_IN" && stayingNights && (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <Clock className="h-4 w-4" />
                  <span>เข้าพักมาแล้ว {stayingNights} คืน</span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="text-sm mb-3">
              <span className="text-muted-foreground">
                {formatCurrency(booking.ratePerNight)}/คืน
              </span>
              {totalNights && (
                <span className="text-muted-foreground">
                  {" "}
                  × {totalNights} คืน ={" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(booking.ratePerNight * totalNights)}
                  </span>
                </span>
              )}
            </div>

            {/* Note */}
            {booking.note && (
              <div className="mb-3">
                <p className="text-sm">
                  <span className="font-medium">หมายเหตุ:</span> {booking.note}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
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
              {booking.status === "RESERVED" && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleCheckIn(booking)}
                >
                  <LogIn className="mr-1 h-3 w-3" />
                  เช็คอิน
                </Button>
              )}

              {booking.status === "CHECKED_IN" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setHotelBooking(booking.customerId, booking.id);
                    router.push("/pos");
                  }}
                >
                  <LogOut className="mr-1 h-3 w-3" />
                  Checkout
                </Button>
              )}

              {!isDisabled && (
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setCancelingBooking(booking)}
                      className="text-destructive"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      ยกเลิกการจอง
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isDisabled && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      จัดการ
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setDeletingBooking(booking)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      ลบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Checked In - show first */}
        {groupedBookings.CHECKED_IN.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium">กำลังเข้าพัก</h3>
              <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">
                {groupedBookings.CHECKED_IN.length} ตัว
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {groupedBookings.CHECKED_IN.map(renderBookingCard)}
            </div>
          </div>
        )}

        {/* Reserved */}
        {groupedBookings.RESERVED.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium">จองแล้ว (รอเช็คอิน)</h3>
              <Badge className="bg-info/10 text-info border-info/30 text-xs">
                {groupedBookings.RESERVED.length} รายการ
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {groupedBookings.RESERVED.map(renderBookingCard)}
            </div>
          </div>
        )}

        {/* Checked Out */}
        {showAll && groupedBookings.CHECKED_OUT.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium">รับกลับแล้ว</h3>
              <Badge className="bg-success/10 text-success border-success/30 text-xs">
                {groupedBookings.CHECKED_OUT.length} รายการ
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {groupedBookings.CHECKED_OUT.map(renderBookingCard)}
            </div>
          </div>
        )}

        {/* Cancelled */}
        {showAll && groupedBookings.CANCELLED.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium">ยกเลิกแล้ว</h3>
              <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                {groupedBookings.CANCELLED.length} รายการ
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {groupedBookings.CANCELLED.map(renderBookingCard)}
            </div>
          </div>
        )}
      </div>

      {/* Edit Booking Dialog */}
      <HotelBookingDialog
        open={editingBooking !== null}
        onOpenChange={(open) => {
          if (!open) setEditingBooking(null);
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
            <AlertDialogTitle>ยืนยันการยกเลิกการจอง</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการยกเลิกการจองโรงแรมของ &quot;{cancelingBooking?.petName}
              &quot; ({cancelingBooking?.customerName}) ใช่หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ยกเลิกการจอง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deletingBooking !== null}
        onOpenChange={(open) => !open && setDeletingBooking(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบข้อมูลการจองนี้ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
    </>
  );
}
