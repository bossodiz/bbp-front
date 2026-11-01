"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader, PageShell } from "@/components/page-shell";
import { BookingList } from "@/components/bookings/booking-list";
import { BookingCalendar } from "@/components/bookings/booking-calendar";
import { BookingDialog } from "@/components/bookings/booking-dialog";

export default function BookingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // มาจากปุ่ม "สร้างนัดหมาย" ในหน้าแรก (/bookings?new=1): เปิดหน้าต่างเพิ่มนัดหมายทันที
  // แล้วล้าง query ออก เพื่อไม่ให้เปิดซ้ำเมื่อรีเฟรช
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setIsDialogOpen(true);
      router.replace("/bookings");
    }
  }, [searchParams, router]);

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
    <PageShell>
      <PageHeader
        title="ระบบนัดหมาย"
        description="จัดการการนัดหมายและมัดจำ"
        actions={
          <>
            <div className="mr-2 flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <Label htmlFor="show-completed" className="text-sm">
                แสดงนัดที่เสร็จแล้ว/ยกเลิก
              </Label>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มนัดหมาย
            </Button>
          </>
        }
      />

      <Tabs
        defaultValue="list"
        className="gap-3 lg:min-h-0 lg:flex-1"
        onValueChange={handleTabChange}
      >
        <TabsList className="shrink-0">
          <TabsTrigger value="calendar">ปฏิทิน</TabsTrigger>
          <TabsTrigger value="list">รายการนัดหมาย</TabsTrigger>
        </TabsList>
        <TabsContent
          value="list"
          className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
        >
          <BookingList
            key={`list-${refreshKey}`}
            showCompleted={showCompleted}
          />
        </TabsContent>
        <TabsContent
          value="calendar"
          className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
        >
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
    </PageShell>
  );
}
