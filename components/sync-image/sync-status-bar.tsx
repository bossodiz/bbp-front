"use client";

import { SyncStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface SyncStatusBarProps {
  status: SyncStatus | null;
}

export function SyncStatusBar({ status }: SyncStatusBarProps) {
  if (!status) return null;

  const lastFetch = status.lastFetchTime
    ? format(new Date(status.lastFetchTime), "d MMM yyyy HH:mm", { locale: th })
    : "ยังไม่เคย fetch";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4 text-sm">
      <span className="text-muted-foreground">
        ดึงรูปภาพจาก Facebook ล่าสุด:{" "}
        <span className="font-medium text-foreground">{lastFetch}</span>
      </span>

      <span className="text-muted-foreground">|</span>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{status.pendingCount} รอการอนุมัติ</Badge>
      </div>
    </div>
  );
}
