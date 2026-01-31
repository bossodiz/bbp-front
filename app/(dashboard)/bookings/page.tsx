"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingList } from "@/components/bookings/booking-list";
import { BookingCalendar } from "@/components/bookings/booking-calendar";
import { BookingDialog } from "@/components/bookings/booking-dialog";

export default function BookingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (value: string) => {
    if (value === "calendar") {
      // เมื่อเปลี่ยนไปที่ tab ปฏิทิน ให้ไฮไลท์วันปัจจุบัน
      setSelectedDate(new Date());
    }
  };

  const handleBookingSuccess = useCallback(() => {
    // Trigger refresh by updating key
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            ระบบนัดหมาย
          </h1>
          <p className="text-muted-foreground">จัดการการนัดหมายและมัดจำ</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มนัดหมาย
        </Button>
      </div>

      <Tabs
        defaultValue="list"
        className="space-y-4"
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="list">รายการนัดหมาย</TabsTrigger>
          <TabsTrigger value="calendar">ปฏิทิน</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <BookingList key={`list-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="calendar" className="space-y-4">
          <BookingCalendar
            key={`calendar-${refreshKey}`}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onAddBooking={() => setIsDialogOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Add Booking Dialog */}
      <BookingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        defaultDate={selectedDate}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}
