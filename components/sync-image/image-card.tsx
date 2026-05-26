"use client";

import { useState } from "react";
import { FbImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageCardProps {
  readonly image: FbImage;
  readonly onApprove?: (id: number) => Promise<void>;
  readonly onReject?: (id: number) => Promise<void>;
}

const statusConfig = {
  pending: { label: "รอการอนุมัติ", variant: "secondary" as const },
  approved: { label: "อนุมัติแล้ว", variant: "outline" as const },
  rejected: { label: "ปฏิเสธแล้ว", variant: "destructive" as const },
  uploaded: { label: "Upload แล้ว", variant: "outline" as const },
};

// Animation phases:
// idle → approve/reject (ring appears, 80ms) → fading-approve/fading-reject (icon + fade out, 500ms) → [removed]
type AnimPhase = "idle" | "approve" | "reject" | "fading-approve" | "fading-reject";

export function ImageCard({ image, onApprove, onReject }: ImageCardProps) {
  const [phase, setPhase] = useState<AnimPhase>("idle");

  const runAnimation = (
    type: "approve" | "reject",
    action: () => Promise<void>,
    successMsg: string,
    errorMsg: string,
  ) => {
    if (phase !== "idle") return;
    setPhase(type);
    setTimeout(() => setPhase(type === "approve" ? "fading-approve" : "fading-reject"), 80);
    setTimeout(async () => {
      try {
        await action();
        toast.success(successMsg);
      } catch {
        toast.error(errorMsg);
        setPhase("idle");
      }
    }, 580);
  };

  const isApproving = phase === "approve" || phase === "fading-approve";
  const isRejecting = phase === "reject" || phase === "fading-reject";
  const isFading = phase === "fading-approve" || phase === "fading-reject";
  const isAnimating = phase !== "idle";
  const hasActions = onApprove || onReject;
  const config = statusConfig[image.status];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-500 ease-out",
        isApproving && "border-green-400 ring-2 ring-green-400",
        isRejecting && "border-red-400 ring-2 ring-red-400",
        isFading && isApproving && "scale-90 bg-green-50 opacity-0",
        isFading && isRejecting && "scale-90 bg-red-50 opacity-0",
      )}
    >
      {/* รูปภาพ + color overlay */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img
          src={image.imageUrl}
          alt={image.postCaption || "รูปภาพจาก Facebook"}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* Icon + tint overlay — ปรากฏเมื่อกด */}
        {isAnimating && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-300",
              isApproving ? "bg-green-500/30" : "bg-red-500/30",
              isFading ? "opacity-100" : "opacity-0",
            )}
          >
            <div
              className={cn(
                "rounded-full p-4 shadow-2xl transition-transform duration-300",
                isApproving ? "bg-green-500" : "bg-red-500",
                isFading ? "scale-100" : "scale-50",
              )}
            >
              {isApproving ? (
                <Check className="h-10 w-10 text-white" strokeWidth={3} />
              ) : (
                <X className="h-10 w-10 text-white" strokeWidth={3} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ข้อมูล */}
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <Badge variant={config.variant}>{config.label}</Badge>
          {image.postUrl && (
            <a
              href={image.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {image.postCaption && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {image.postCaption}
          </p>
        )}

        {image.errorMessage && (
          <p className="text-xs text-destructive">{image.errorMessage}</p>
        )}

        {/* ปุ่ม — แสดงถ้ามี callback ส่งมา */}
        {hasActions && (
          <div className="flex gap-2">
            {onApprove && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() =>
                  runAnimation(
                    "approve",
                    () => onApprove(image.id),
                    "อนุมัติรูปภาพแล้ว",
                    "อนุมัติรูปภาพไม่สำเร็จ",
                  )
                }
                disabled={isAnimating}
              >
                <Check className="mr-1 h-3 w-3" />
                อนุมัติ
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() =>
                  runAnimation(
                    "reject",
                    () => onReject(image.id),
                    "ปฏิเสธรูปภาพแล้ว",
                    "ปฏิเสธรูปภาพไม่สำเร็จ",
                  )
                }
                disabled={isAnimating}
              >
                <X className="mr-1 h-3 w-3" />
                ปฏิเสธ
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
