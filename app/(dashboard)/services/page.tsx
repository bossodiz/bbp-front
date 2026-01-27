"use client";

import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceList } from "@/components/services/service-list";
import { ServiceDialog } from "@/components/services/service-dialog";
import { ServiceConfigDialog } from "@/components/services/service-config-dialog";

export default function ServicesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            บริการและราคา
          </h1>
          <p className="text-muted-foreground">
            จัดการบริการและกำหนดราคาตามประเภทสัตว์และขนาด
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsConfigOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            ตั้งค่าประเภท/ขนาด
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มบริการใหม่
          </Button>
        </div>
      </div>

      <ServiceList />

      <ServiceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <ServiceConfigDialog open={isConfigOpen} onOpenChange={setIsConfigOpen} />
    </div>
  );
}
