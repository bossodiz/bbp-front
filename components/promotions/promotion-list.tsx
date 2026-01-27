"use client";

import { useState } from "react";
import { Pencil, Trash2, Percent, Banknote, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PromotionDialog } from "./promotion-dialog";
import { usePromotionStore, useServiceStore } from "@/lib/store";
import type { Promotion } from "@/lib/types";
import { promotionTypeLabels } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeIcons = {
  PERCENT: Percent,
  AMOUNT: Banknote,
  FREE_SERVICE: Gift,
};

export function PromotionList() {
  const { promotions, deletePromotion, togglePromotion } = usePromotionStore();
  const { services } = useServiceStore();
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);

  const handleDelete = () => {
    if (deletingPromotion) {
      deletePromotion(deletingPromotion.id);
      toast.success("ลบโปรโมชั่นเรียบร้อยแล้ว");
      setDeletingPromotion(null);
    }
  };

  const handleToggle = (id: number, active: boolean) => {
    togglePromotion(id);
    toast.success(active ? "ปิดใช้งานโปรโมชั่น" : "เปิดใช้งานโปรโมชั่น");
  };

  const formatValue = (promotion: Promotion) => {
    switch (promotion.type) {
      case "PERCENT":
        return `ลด ${promotion.value}%`;
      case "AMOUNT":
        return `ลด ${promotion.value} บาท`;
      case "FREE_SERVICE":
        const service = services.find((s) => s.id === promotion.freeServiceId);
        return `แถม ${service?.name || "บริการ"}`;
      default:
        return "";
    }
  };

  if (promotions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">ยังไม่มีโปรโมชั่นในระบบ</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promotion) => {
          const Icon = typeIcons[promotion.type];
          return (
            <Card
              key={promotion.id}
              className={cn(
                "transition-opacity",
                !promotion.active && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      promotion.active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{promotion.name}</p>
                    </div>
                    <Badge
                      variant={promotion.active ? "default" : "secondary"}
                      className="mb-2"
                    >
                      {formatValue(promotion)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {promotionTypeLabels[promotion.type]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={promotion.active}
                      onCheckedChange={() =>
                        handleToggle(promotion.id, promotion.active)
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {promotion.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingPromotion(promotion)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingPromotion(promotion)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Promotion Dialog */}
      <PromotionDialog
        open={editingPromotion !== null}
        onOpenChange={(open) => !open && setEditingPromotion(null)}
        promotion={editingPromotion}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deletingPromotion !== null}
        onOpenChange={(open) => !open && setDeletingPromotion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบโปรโมชั่น</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบโปรโมชั่น &quot;{deletingPromotion?.name}&quot; ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
