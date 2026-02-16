"use client";

import { useState, useCallback } from "react";
import { BedDouble, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotelBookingList } from "@/components/hotel/hotel-booking-list";
import { HotelBookingDialog } from "@/components/hotel/hotel-booking-dialog";
import { ServiceConfigProvider } from "@/lib/contexts/service-config-context";

export default function HotelPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <ServiceConfigProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <BedDouble className="h-7 w-7" />
              โรงแรมสัตว์เลี้ยง
            </h1>
            <p className="text-muted-foreground">
              จัดการการจองห้องพักสำหรับสัตว์เลี้ยง
            </p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            จองห้องพัก
          </Button>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">กำลังเข้าพัก / จองแล้ว</TabsTrigger>
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            <HotelBookingList key={`active-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            <HotelBookingList key={`all-${refreshKey}`} showAll />
          </TabsContent>
        </Tabs>

        <HotelBookingDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onSuccess={handleSuccess}
        />
      </div>
    </ServiceConfigProvider>
  );
}
