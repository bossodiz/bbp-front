"use client";

import { FbImage } from "@/lib/types";
import { ImageCard } from "./image-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";

interface ImageGridProps {
  readonly images: FbImage[];
  readonly loading: boolean;
  readonly onApprove?: (id: number) => Promise<void>;
  readonly onReject?: (id: number) => Promise<void>;
  readonly emptyMessage?: string;
}

export function ImageGrid({
  images,
  loading,
  onApprove,
  onReject,
  emptyMessage = "ไม่มีรูปภาพ",
}: ImageGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <ImageOff className="h-12 w-12 opacity-40" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
