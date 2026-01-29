"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromotionList } from "@/components/promotions/promotion-list";

export default function PromotionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">โปรโมชั่น</h1>
          <p className="text-muted-foreground">
            จัดการโปรโมชั่นและส่วนลดสำหรับลูกค้า
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มโปรโมชั่น
        </Button>
      </div>

      <PromotionList
        addDialogOpen={isDialogOpen}
        onAddDialogChange={setIsDialogOpen}
      />
    </div>
  );
}
