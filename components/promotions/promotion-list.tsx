"use client";

import { useState, useMemo, useCallback } from "react";
import { Pencil, Percent, Banknote, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PromotionDialog } from "./promotion-dialog";
import { usePromotions } from "@/lib/hooks/use-promotions";
import { useServices } from "@/lib/hooks/use-services";
import type { Promotion } from "@/lib/types";
import { promotionTypeLabels } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeIcons = {
  PERCENT: Percent,
  AMOUNT: Banknote,
  FREE_SERVICE: Gift,
};

interface PromotionListProps {
  addDialogOpen?: boolean;
  onAddDialogChange?: (open: boolean) => void;
}

export function PromotionList({
  addDialogOpen = false,
  onAddDialogChange,
}: PromotionListProps = {}) {
  const { promotions, loading, togglePromotion, fetchPromotions } =
    usePromotions();
  const { services } = useServices();
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );

  const handleToggle = async (id: number, active: boolean) => {
    try {
      await togglePromotion(id, !active);
      toast.success(active ? "ปิดใช้งานโปรโมชั่น" : "เปิดใช้งานโปรโมชั่น");
    } catch (error: any) {
      toast.error(error.message || "ไม่สามารถเปลี่ยนสถานะโปรโมชั่นได้");
    }
  };

  const formatValue = useCallback(
    (promotion: Promotion) => {
      switch (promotion.type) {
        case "PERCENT":
          return `ลด ${promotion.value}%`;
        case "AMOUNT":
          return `ลด ${promotion.value} บาท`;
        case "FREE_SERVICE":
          const service = services.find(
            (s) => s.id === promotion.freeServiceId,
          );
          return `แถม ${service?.name || "บริการ"}`;
        default:
          return "";
      }
    },
    [services],
  );

  if (loading) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-2">กำลังโหลด...</p>
          </CardContent>
        </Card>

        {/* Add Promotion Dialog */}
        <PromotionDialog
          open={addDialogOpen}
          onOpenChange={(open) => {
            onAddDialogChange?.(open);
            if (!open) {
              fetchPromotions();
            }
          }}
        />

        {/* Edit Promotion Dialog */}
        <PromotionDialog
          open={editingPromotion !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPromotion(null);
              fetchPromotions();
            }
          }}
          promotion={editingPromotion}
        />
      </>
    );
  }

  if (promotions.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">ยังไม่มีโปรโมชั่นในระบบ</p>
          </CardContent>
        </Card>

        {/* Add Promotion Dialog */}
        <PromotionDialog
          open={addDialogOpen}
          onOpenChange={(open) => {
            onAddDialogChange?.(open);
            if (!open) {
              fetchPromotions();
            }
          }}
        />

        {/* Edit Promotion Dialog */}
        <PromotionDialog
          open={editingPromotion !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPromotion(null);
              fetchPromotions();
            }
          }}
          promotion={editingPromotion}
        />
      </>
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
                !promotion.active && "opacity-60",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      promotion.active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
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
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Promotion Dialog */}
      <PromotionDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          onAddDialogChange?.(open);
          if (!open) {
            // Refresh data เมื่อปิด dialog
            fetchPromotions();
          }
        }}
      />

      {/* Edit Promotion Dialog */}
      <PromotionDialog
        open={editingPromotion !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPromotion(null);
            // Refresh data เมื่อปิด dialog
            fetchPromotions();
          }
        }}
        promotion={editingPromotion}
      />
    </>
  );
}
