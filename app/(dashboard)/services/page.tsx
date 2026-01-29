"use client";

import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceList } from "@/components/services/service-list";
import { ServiceDialog } from "@/components/services/service-dialog";
import { ServiceConfigDialog } from "@/components/services/service-config-dialog";
import { useServices } from "@/lib/hooks/use-services";
import { ServiceConfigProvider } from "@/lib/contexts/service-config-context";

export default function ServicesPage() {
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { services, loading, error, fetchServices } = useServices();

  return (
    <ServiceConfigProvider>
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
            <Button onClick={() => setIsAddServiceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มบริการใหม่
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            เกิดข้อผิดพลาด: {error}
          </div>
        )}

        <ServiceList
          services={services}
          loading={loading}
          onRefresh={fetchServices}
        />

        <ServiceDialog
          open={isAddServiceOpen}
          onOpenChange={setIsAddServiceOpen}
          service={null}
          onSuccess={fetchServices}
        />
        <ServiceConfigDialog
          open={isConfigOpen}
          onOpenChange={setIsConfigOpen}
        />
      </div>
    </ServiceConfigProvider>
  );
}
