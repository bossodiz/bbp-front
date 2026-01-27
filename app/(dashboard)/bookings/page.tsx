"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingList } from "@/components/bookings/booking-list";
import { BookingCalendar } from "@/components/bookings/booking-calendar";
import { BookingDialog } from "@/components/bookings/booking-dialog";

export default function BookingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            ระบบนัดหมาย
          </h1>
          <p className="text-muted-foreground">
            จัดการการนัดหมายและมัดจำ
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มนัดหมาย
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">รายการนัดหมาย</TabsTrigger>
          <TabsTrigger value="calendar">ปฏิทิน</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <BookingList />
        </TabsContent>
        <TabsContent value="calendar" className="space-y-4">
          <BookingCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </TabsContent>
      </Tabs>

      <BookingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
}
