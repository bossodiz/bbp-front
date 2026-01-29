"use client";

import { format, isSameDay } from "date-fns";
import { th } from "date-fns/locale";
import { Dog, Cat, Clock, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBookings } from "@/lib/hooks/use-bookings";
import { cn, formatPhoneDisplay, getBangkokDate } from "@/lib/utils";

interface BookingCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onAddBooking?: () => void;
}

export function BookingCalendar({
  selectedDate,
  onSelectDate,
  onAddBooking,
}: BookingCalendarProps) {
  const { bookings, loading } = useBookings();
  const today = getBangkokDate();

  // Get bookings for selected date
  const selectedDateBookings = bookings.filter((booking) =>
    isSameDay(new Date(booking.bookingDate), selectedDate),
  );

  // Get dates that have bookings
  const datesWithBookings = bookings.map((booking) =>
    format(new Date(booking.bookingDate), "yyyy-MM-dd"),
  );

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
              today: (date) => isSameDay(date, today),
            }}
            modifiersStyles={{
              hasBooking: {
                backgroundColor: "oklch(0.92 0.04 145)",
                borderRadius: "var(--radius)",
                fontWeight: "500",
              },
              today: {
                textDecoration: "underline",
                textDecorationThickness: "2px",
                textUnderlineOffset: "4px",
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
                .map((booking) => {
                  const pets = booking.pets || [];

                  return (
                    <div
                      key={booking.id}
                      className="p-3 rounded-lg border bg-card space-y-2"
                    >
                      {/* Header: Customer name, phone, time */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-base font-medium">
                            {booking.customerName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPhoneDisplay(booking.phone)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-base font-medium">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.bookingTime.substring(0, 5)} น.</span>
                        </div>
                      </div>

                      {/* Pet list with services */}
                      {pets.length > 0 && (
                        <div className="space-y-1">
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
                              <span className="font-medium">{pet.name}</span>
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
                        <p className="text-sm text-muted-foreground border-t pt-2">
                          {booking.note}
                        </p>
                      )}

                      {/* Footer: Deposit badge */}
                      {booking.depositStatus !== "NONE" && (
                        <div className="flex justify-end border-t pt-2">
                          <Badge variant="outline" className="text-sm">
                            มัดจำ {formatCurrency(booking.depositAmount)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
