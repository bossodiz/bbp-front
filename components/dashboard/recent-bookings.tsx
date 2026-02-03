"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dog, Cat, Clock, MessageSquare, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTodayBookings } from "@/lib/hooks/use-today-bookings";

export function RecentBookings() {
  const { data: todayBookings, loading } = useTodayBookings();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // อัพเดทเวลาปัจจุบันทุกวินาที - เริ่มต้นหลัง mount เท่านั้น
  useEffect(() => {
    setIsMounted(true);
    // Set initial time on client
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    // Use manual formatting to avoid locale mismatch
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // ตรวจสอบว่ารายการเลยเวลานัดหรือไม่
  const isOverdue = (bookingTime: string) => {
    if (!bookingTime || !currentTime) return false;

    const today = new Date();
    const [hours, minutes] = bookingTime.split(":").map(Number);
    const bookingDateTime = new Date(today);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    return currentTime > bookingDateTime;
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle>นัดหมายวันนี้</CardTitle>
              <CardDescription>
                ทุกนัดหมายของวันนี้{" "}
                {loading ? "..." : `${todayBookings.length} รายการ`}
              </CardDescription>
            </div>
            {isMounted && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm text-muted-foreground border border-muted-foreground/20">
                <Clock className="h-4 w-4" />
                <span className="font-mono font-medium">
                  {currentTime ? formatTime(currentTime) : "--:--:--"}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : todayBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              ไม่มีนัดหมายสำหรับวันนี้
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((booking) => {
                const customerName = booking.customerName || "ลูกค้า";
                const pet = booking.pets?.[0]; // เอา pet แรก
                const petName = pet?.name || "สัตว์เลี้ยง";
                const petType = pet?.type || "DOG";
                const serviceName = pet?.service || "บริการ";
                const overdue = isOverdue(booking.bookingTime);

                return (
                  <div
                    key={booking.id}
                    className={cn(
                      "flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors",
                      overdue &&
                        "bg-muted/50 border-muted-foreground/20 opacity-75",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                        petType === "DOG"
                          ? "bg-dog/10 text-dog"
                          : "bg-cat/10 text-cat",
                        overdue &&
                          "bg-muted-foreground/20 text-muted-foreground",
                      )}
                    >
                      {petType === "DOG" ? (
                        <Dog className="h-5 w-5" />
                      ) : (
                        <Cat className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            overdue && "text-muted-foreground",
                          )}
                        >
                          {petName}
                        </p>
                        {booking.depositAmount > 0 && (
                          <Badge
                            variant="default"
                            className={cn(
                              "text-xs",
                              overdue &&
                                "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
                            )}
                          >
                            {formatCurrency(booking.depositAmount)}
                          </Badge>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-xs text-muted-foreground",
                          overdue && "text-muted-foreground/70",
                        )}
                      >
                        {customerName} - {serviceName}
                      </p>
                      {booking.note && (
                        <div
                          className={cn(
                            "flex items-start gap-1 mt-1.5 text-xs text-warning bg-warning/10 px-2 py-1 rounded",
                            overdue &&
                              "bg-muted-foreground/10 text-muted-foreground",
                          )}
                        >
                          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{booking.note}</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm text-muted-foreground shrink-0",
                        overdue && "text-muted-foreground/70",
                      )}
                    >
                      <Clock className="h-4 w-4" />
                      <span>{booking.bookingTime || "-"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
