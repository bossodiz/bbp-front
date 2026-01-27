"use client";

import { format, isSameDay } from "date-fns";
import { th } from "date-fns/locale";
import { Dog, Cat, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBookingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function BookingCalendar({
  selectedDate,
  onSelectDate,
}: BookingCalendarProps) {
  const { bookings } = useBookingStore();

  // Get bookings for selected date
  const selectedDateBookings = bookings.filter((booking) =>
    isSameDay(new Date(booking.bookingDate), selectedDate)
  );

  // Get dates that have bookings
  const datesWithBookings = bookings.map((booking) =>
    format(new Date(booking.bookingDate), "yyyy-MM-dd")
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ปฏิทินนัดหมาย</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onSelectDate(date)}
            className="rounded-md border w-full"
            modifiers={{
              hasBooking: (date) =>
                datesWithBookings.includes(format(date, "yyyy-MM-dd")),
            }}
            modifiersStyles={{
              hasBooking: {
                backgroundColor: "oklch(0.92 0.04 145)",
                borderRadius: "var(--radius)",
                fontWeight: "500",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: th })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>ไม่มีนัดหมายในวันนี้</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateBookings
                .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime))
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                        booking.petType === "DOG"
                          ? "bg-dog/10 text-dog"
                          : "bg-cat/10 text-cat"
                      )}
                    >
                      {booking.petType === "DOG" ? (
                        <Dog className="h-5 w-5" />
                      ) : (
                        <Cat className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {booking.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.serviceType}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{booking.bookingTime}</span>
                      </div>
                      {booking.depositStatus !== "NONE" && (
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(booking.depositAmount)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
