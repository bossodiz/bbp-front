"use client";

import { useState, useCallback } from "react";
import { BedDouble, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, PageShell } from "@/components/page-shell";
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
      <PageShell>
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <BedDouble className="h-6 w-6" />
              โรงแรมสัตว์เลี้ยง
            </span>
          }
          description="จัดการการจองห้องพักสำหรับสัตว์เลี้ยง"
          actions={
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              จองห้องพัก
            </Button>
          }
        />

        <Tabs defaultValue="active" className="gap-3 lg:min-h-0 lg:flex-1">
          <TabsList className="shrink-0">
            <TabsTrigger value="active">กำลังเข้าพัก / จองแล้ว</TabsTrigger>
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          </TabsList>
          <TabsContent
            value="active"
            className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
          >
            <HotelBookingList key={`active-${refreshKey}`} />
          </TabsContent>
          <TabsContent
            value="all"
            className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
          >
            <HotelBookingList key={`all-${refreshKey}`} showAll />
          </TabsContent>
        </Tabs>

        <HotelBookingDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onSuccess={handleSuccess}
        />
      </PageShell>
    </ServiceConfigProvider>
  );
}
