"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageScroll, PageShell } from "@/components/page-shell";
import { PromotionList } from "@/components/promotions/promotion-list";

export default function PromotionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <PageShell>
      <PageHeader
        title="โปรโมชั่น"
        description="จัดการโปรโมชั่นและส่วนลดสำหรับลูกค้า"
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มโปรโมชั่น
          </Button>
        }
      />

      <PageScroll>
        <PromotionList
          addDialogOpen={isDialogOpen}
          onAddDialogChange={setIsDialogOpen}
        />
      </PageScroll>
    </PageShell>
  );
}
