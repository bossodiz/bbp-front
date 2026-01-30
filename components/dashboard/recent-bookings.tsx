"use client";

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>นัดหมายวันนี้</CardTitle>
          <CardDescription>
            ทุกนัดหมายของวันนี้{" "}
            {loading ? "..." : `${todayBookings.length} รายการ`}
          </CardDescription>
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

                return (
                  <div
                    key={booking.id}
                    className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                        petType === "DOG"
                          ? "bg-dog/10 text-dog"
                          : "bg-cat/10 text-cat",
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
                        <p className="text-sm font-medium truncate">
                          {petName}
                        </p>
                        {booking.depositAmount > 0 && (
                          <Badge variant="default" className="text-xs">
                            {formatCurrency(booking.depositAmount)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {customerName} - {serviceName}
                      </p>
                      {booking.note && (
                        <div className="flex items-start gap-1 mt-1.5 text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{booking.note}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
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
