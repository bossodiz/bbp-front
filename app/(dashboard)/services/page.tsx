"use client";

import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/page-shell";
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
      <PageShell>
        <PageHeader
          title="บริการและราคา"
          description="จัดการบริการและกำหนดราคาตามประเภทสัตว์และขนาด"
          actions={
            <>
              <Button
                variant="outline"
                className="h-11 sm:h-9"
                onClick={() => setIsConfigOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                ตั้งค่าประเภท/ขนาด
              </Button>
              <Button
                className="h-11 sm:h-9"
                onClick={() => setIsAddServiceOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มบริการใหม่
              </Button>
            </>
          }
        />

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            เกิดข้อผิดพลาด: {error}
          </div>
        )}

        <div className="lg:min-h-0 lg:flex-1">
          <ServiceList
            services={services}
            loading={loading}
            onRefresh={fetchServices}
          />
        </div>

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
      </PageShell>
    </ServiceConfigProvider>
  );
}
